"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"

/**
 * Custom hook to prevent navigation with a confirmation dialog
 */
export function usePreventNavigation(shouldBlock: boolean) {
  const navigate = useNavigate()
  const location = useLocation()
  const [showDialog, setShowDialog] = useState(false)
  const [pendingLocation, setPendingLocation] = useState<string | null>(null)
  const lastLocationRef = useRef(location)
  const navigationAttemptedRef = useRef(false)
  const originalTargetRef = useRef<string | null>(null)

  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldBlock) {
        event.preventDefault()
        event.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [shouldBlock])

  // Handle location changes (browser back/forward)
  useEffect(() => {
    if (shouldBlock && location !== lastLocationRef.current && !navigationAttemptedRef.current) {
      // Only block if the pathname changes (not just search params)
      if (location.pathname !== lastLocationRef.current.pathname) {
        // Prevent the navigation
        navigationAttemptedRef.current = true

        // Store the attempted path
        const fullPath = location.pathname + location.search
        console.log("Storing pending location from history change:", fullPath)
        setPendingLocation(fullPath)
        originalTargetRef.current = fullPath

        // Show the dialog
        setShowDialog(true)

        // Navigate back to prevent the navigation
        navigate(-1)
      }
    }

    // Always update the last location
    lastLocationRef.current = location
    navigationAttemptedRef.current = false
  }, [location, shouldBlock, navigate])

  // Handle clicks on navigation elements (menu buttons, etc.)
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!shouldBlock) return

      const target = event.target as HTMLElement

      // Skip if the click is inside the form
      if (target.closest("form") !== null) return

      // Skip if the click is inside a dialog
      if (target.closest(".MuiDialog-root") !== null) return

      // Skip if the click is inside a popover or menu
      if (target.closest(".MuiPopover-root") !== null) return

      // Skip if the click is inside a date picker
      if (target.closest(".MuiPickersPopper-root") !== null) return

      // Skip if the click is inside the wizard form container
      if (target.closest('[data-wizard-form="true"]') !== null) return

      // Check if the click was on a button or link that would cause navigation
      const navigationElement = target.closest("a, button")
      if (!navigationElement) return

      // Skip if it's an external link or special link
      if (navigationElement instanceof HTMLAnchorElement) {
        const href = navigationElement.getAttribute("href")
        if (
          !href ||
          href.startsWith("http") ||
          href.startsWith("#") ||
          href.startsWith("tel:") ||
          href.startsWith("mailto:")
        ) {
          return
        }
      }

      // Skip if it's a button inside the wizard form
      if (navigationElement.closest('[data-wizard-form="true"]') !== null) {
        return
      }

      // Skip if it's a button with specific text that indicates it's part of the wizard navigation
      const buttonText = navigationElement.textContent?.trim().toLowerCase() || ""
      if (
        buttonText.includes("next") ||
        buttonText.includes("back") ||
        buttonText.includes("previous") ||
        buttonText.includes("submit") ||
        buttonText.includes("save") ||
        buttonText.includes("add") ||
        buttonText.includes("toliau") || // Lithuanian for "next"
        buttonText.includes("atgal") || // Lithuanian for "back"
        buttonText.includes("pridėti") // Lithuanian for "add"
      ) {
        return
      }

      // Check for data-attributes that might indicate navigation
      const hasNavigationIntent =
        navigationElement.hasAttribute("href") ||
        navigationElement.hasAttribute("to") ||
        navigationElement.getAttribute("role") === "link" ||
        navigationElement.classList.contains("nav-link") ||
        // Only catch buttons that are likely to navigate away from the form
        (navigationElement.tagName === "BUTTON" &&
          !navigationElement.closest("form") && // Not in a form
          !navigationElement.closest('[role="dialog"]') && // Not in a dialog
          !navigationElement.closest('[data-wizard-form="true"]')) // Not in the wizard form

      if (hasNavigationIntent) {
        // For MUI buttons, we need to check if they're not form submission buttons
        if (navigationElement.tagName === "BUTTON") {
          const type = navigationElement.getAttribute("type")
          // Skip submit and reset buttons
          if (type === "submit" || type === "reset") {
            return
          }
        }

        // Check if this is a navigation button inside the wizard
        const isWizardNavigation =
          navigationElement.closest(".MuiStepper-root") !== null || // Stepper component
          navigationElement.closest('[data-wizard-navigation="true"]') !== null // Custom attribute

        if (isWizardNavigation) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        // Store the attempted path
        let targetPath = "/"

        // If it's a link, get the href
        if (navigationElement instanceof HTMLAnchorElement) {
          // Get the full path from the link
          targetPath = navigationElement.pathname + (navigationElement.search || "")
          console.log("Storing pending location from link click:", targetPath)
        }
        // For buttons with data-href attribute (common in some UI frameworks)
        else if (navigationElement.hasAttribute("data-href")) {
          targetPath = navigationElement.getAttribute("data-href") || "/"
          console.log("Storing pending location from data-href:", targetPath)
        }
        // For buttons with data-path attribute
        else if (navigationElement.hasAttribute("data-path")) {
          targetPath = navigationElement.getAttribute("data-path") || "/"
          console.log("Storing pending location from data-path:", targetPath)
        }
        // For React Router Link components that might be rendered as buttons
        else if (navigationElement.hasAttribute("to")) {
          targetPath = navigationElement.getAttribute("to") || "/"
          console.log("Storing pending location from to attribute:", targetPath)
        }
        // For navigation elements with a specific destination in the dataset
        else if (navigationElement.dataset.destination) {
          targetPath = navigationElement.dataset.destination
          console.log("Storing pending location from data-destination:", targetPath)
        }
        // Try to get the closest link's href if the button is inside a link wrapper
        else {
          const parentLink = navigationElement.closest("a")
          if (parentLink && parentLink.pathname) {
            targetPath = parentLink.pathname + (parentLink.search || "")
            console.log("Storing pending location from parent link:", targetPath)
          } else {
            // If we can't determine the path, log it and use default
            console.log("Could not determine navigation path, using default:", targetPath)
          }
        }

        // Store the path for later navigation
        setPendingLocation(targetPath)
        originalTargetRef.current = targetPath
        setShowDialog(true)
      }
    }

    document.addEventListener("click", handleClick, { capture: true })
    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
    }
  }, [shouldBlock])

  const handleStay = useCallback(() => {
    setShowDialog(false)
    setPendingLocation(null)
    originalTargetRef.current = null
    navigationAttemptedRef.current = false
  }, [])

  const handleLeave = useCallback(
    (savedSuccessfully: boolean) => {
      if (savedSuccessfully) {
        setShowDialog(false)
        navigationAttemptedRef.current = false

        // Use the original target if available, otherwise use pendingLocation
        const targetLocation = originalTargetRef.current || pendingLocation

        if (targetLocation) {
          console.log("Navigating to target location:", targetLocation)
          // Use a timeout to ensure the dialog is closed before navigation
          setTimeout(() => {
            navigate(targetLocation)
          }, 100)
        } else {
          console.warn("No target location to navigate to")
        }
      }
    },
    [navigate, pendingLocation],
  )

  return {
    showDialog,
    pendingLocation: originalTargetRef.current || pendingLocation,
    handleStay,
    handleLeave,
  }
}