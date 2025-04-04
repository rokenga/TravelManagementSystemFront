"use client"

import { useState, useRef, useCallback } from "react"

/**
 * Action types for navigation control
 * These represent different types of actions that should not trigger the navigation prevention dialog
 */
export type NavigationAction =
  | "delete" // Deleting an event or item
  | "tab" // Navigating between wizard tabs
  | "itinerary" // Navigating within the itinerary (next/prev day)
  | "images" // Adding or removing images
  | "save" // Explicitly saving the form
  | "leave" // Explicitly leaving the form
  | "none" // No active controlled action

export interface NavigationControlOptions {
  shouldBlockNavigation: boolean
  isEditMode?: boolean
}

/**
 * Custom hook to control navigation behavior and prevent unwanted save dialogs
 * This hook manages the state of controlled actions that should not trigger
 * the navigation prevention dialog
 */
export function useNavigationControl({ shouldBlockNavigation, isEditMode = false }: NavigationControlOptions) {
  // Track the current action
  const [currentAction, setCurrentAction] = useState<NavigationAction>("none")

  // Use a ref to track if we're currently in a controlled action
  // This is more reliable than state for synchronous checks
  const isControlledActionRef = useRef(false)

  // Function to start a controlled action
  const startAction = useCallback((action: NavigationAction) => {
    console.log(`Starting controlled action: ${action}`)
    isControlledActionRef.current = true
    setCurrentAction(action)
  }, [])

  // Function to end a controlled action
  const endAction = useCallback(() => {
    console.log("Ending controlled action")
    isControlledActionRef.current = false
    setCurrentAction("none")
  }, [])

  // Function to check if we should show the dialog
  const shouldShowDialog = useCallback(
    (action: NavigationAction): boolean => {
      // Only show the dialog for 'leave' action when shouldBlockNavigation is true
      if (action === "leave" && shouldBlockNavigation) {
        return true
      }

      // For all other actions, don't show the dialog
      return false
    },
    [shouldBlockNavigation],
  )

  return {
    currentAction,
    isControlledAction: isControlledActionRef.current,
    startAction,
    endAction,
    shouldShowDialog,
    isEditMode,
  }
}

