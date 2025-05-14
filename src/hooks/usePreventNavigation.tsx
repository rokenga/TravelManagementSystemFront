"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useLocation, useNavigate, useBeforeUnload } from "react-router-dom"

export function usePreventNavigation(hasChanges: boolean) {
  const [showDialog, setShowDialog] = useState(false)
  const [pendingLocation, setPendingLocation] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const lastLocationRef = useRef(location)
  const navigationAttemptedRef = useRef(false)
  const originalTargetRef = useRef<string | null>(null)
  const hasChangesRef = useRef(hasChanges)

  useEffect(() => {
    hasChangesRef.current = hasChanges
  }, [hasChanges])

  useBeforeUnload(
    (event) => {
      if (hasChanges) {
        event.preventDefault()
        event.returnValue = "You have unsaved changes. Are you sure you want to leave?"
        return event.returnValue
      }
    },
    [hasChanges],
  )

  useEffect(() => {
    const handleBeforeNavigate = (event: PopStateEvent) => {
      if (!hasChangesRef.current) return

      event.preventDefault()

      const destinationUrl = window.location.href
      setPendingLocation(destinationUrl)
      originalTargetRef.current = destinationUrl

      setShowDialog(true)

      window.history.pushState(null, "", location.pathname)
    }

    window.addEventListener("popstate", handleBeforeNavigate)

    return () => {
      window.removeEventListener("popstate", handleBeforeNavigate)
    }
  }, [location.pathname])

  useEffect(() => {
    if (hasChanges && location !== lastLocationRef.current && !navigationAttemptedRef.current) {
      if (location.pathname !== lastLocationRef.current.pathname) {
        navigationAttemptedRef.current = true

        const fullPath = location.pathname + location.search
        setPendingLocation(fullPath)
        originalTargetRef.current = fullPath

        setShowDialog(true)

        navigate(-1)
      }
    }

    lastLocationRef.current = location
    const timeoutId = setTimeout(() => {
      navigationAttemptedRef.current = false
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [location, hasChanges, navigate])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!hasChangesRef.current) return

      const target = event.target as HTMLElement

      if (target.closest("form") !== null) return
      if (target.closest(".MuiDialog-root") !== null) return
      if (target.closest(".MuiPopover-root") !== null) return
      if (target.closest(".MuiPickersPopper-root") !== null) return
      if (target.closest('[role="presentation"]') !== null) return
      if (
        target.closest(".MuiInputBase-root") !== null &&
        target.closest(".MuiInputBase-root")?.querySelector('input[type="text"]') !== null
      )
        return
      if (target.closest('[data-wizard-form="true"]') !== null) return
      if (target.closest(".MuiAccordionSummary-root") !== null) return
      if (target.closest('[data-tab-button="true"]') !== null) return
      if (target.closest('[data-upload-component="true"]') !== null) return
      if (target.closest('[data-file-input="true"]') !== null || target.closest('[data-upload-button="true"]') !== null)
        return
      if (target.closest('[data-image-delete-button="true"]') !== null) return
      if (target.closest('[data-datepicker="true"]') !== null) return
      if (target.closest(".MuiDatePicker-root") !== null) return
      if (target.closest(".MuiDateTimePicker-root") !== null) return
      if (target.closest(".MuiPickersLayout-root") !== null) return
      if (target.closest(".MuiPickersToolbar-root") !== null) return
      if (target.closest(".MuiPickersCalendarHeader-root") !== null) return
      if (target.closest(".MuiPickersDay-root") !== null) return
      if (target.closest(".MuiClock-root") !== null) return
      if (target.closest(".MuiClockNumber-root") !== null) return
      if (target.closest(".MuiPickersArrowSwitcher-root") !== null) return
      if (target.closest(".MuiPickersMonth-root") !== null) return
      if (target.closest(".MuiPickersYear-root") !== null) return
      if (target.closest(".MuiPickersSlideTransition-root") !== null) return

      const navigationElement = target.closest("a, button")
      if (!navigationElement) return

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

      if (navigationElement.closest('[data-wizard-form="true"]') !== null) {
        return
      }

      const buttonText = navigationElement.textContent?.trim().toLowerCase() || ""
      if (
        buttonText.includes("next") ||
        buttonText.includes("back") ||
        buttonText.includes("previous") ||
        buttonText.includes("submit") ||
        buttonText.includes("save") ||
        buttonText.includes("add") ||
        buttonText.includes("toliau") ||
        buttonText.includes("atgal") ||
        buttonText.includes("pridėti")
      ) {
        return
      }

      if (target.closest('[data-delete-offer-button="true"]') !== null) return
      if (target.closest('[data-save-button="true"]') !== null) return

      const hasNavigationIntent =
        navigationElement.hasAttribute("href") ||
        navigationElement.hasAttribute("to") ||
        navigationElement.getAttribute("role") === "link" ||
        navigationElement.classList.contains("nav-link") ||
        (navigationElement.tagName === "BUTTON" &&
          !navigationElement.closest("form") &&
          !navigationElement.closest('[role="dialog"]') &&
          !navigationElement.closest('[data-wizard-form="true"]'))

      if (hasNavigationIntent) {
        if (navigationElement.tagName === "BUTTON") {
          const type = navigationElement.getAttribute("type")
          if (type === "submit" || type === "reset") {
            return
          }
        }

        const isWizardNavigation =
          navigationElement.closest(".MuiStepper-root") !== null ||
          navigationElement.closest('[data-wizard-navigation="true"]') !== null

        if (isWizardNavigation) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        let targetPath = "/"

        if (navigationElement instanceof HTMLAnchorElement) {
          targetPath = navigationElement.pathname + (navigationElement.search || "")
        } else if (navigationElement.hasAttribute("data-href")) {
          targetPath = navigationElement.getAttribute("data-href") || "/"
        } else if (navigationElement.hasAttribute("data-path")) {
          targetPath = navigationElement.getAttribute("data-path") || "/"
        } else if (navigationElement.hasAttribute("to")) {
          targetPath = navigationElement.getAttribute("to") || "/"
        } else if ((navigationElement as HTMLElement).dataset?.destination) {
          targetPath = (navigationElement as HTMLElement).dataset.destination
        } else {
          const parentLink = navigationElement.closest("a")
          if (parentLink && parentLink.pathname) {
            targetPath = parentLink.pathname + (parentLink.search || "")
          }
        }

        setPendingLocation(targetPath)
        originalTargetRef.current = targetPath
        setShowDialog(true)
      }
    }

    document.addEventListener("click", handleClick, { capture: true })
    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
    }
  }, [])

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

        const targetLocation = originalTargetRef.current || pendingLocation

        if (targetLocation) {
          setTimeout(() => {
            navigate(targetLocation)
          }, 200)
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
