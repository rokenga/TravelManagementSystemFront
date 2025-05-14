"use client"

import { useState, useRef, useCallback } from "react"

export type NavigationAction =
  | "delete" 
  | "tab" 
  | "itinerary" 
  | "images" 
  | "save" 
  | "leave" 
  | "none" 

export interface NavigationControlOptions {
  shouldBlockNavigation: boolean
  isEditMode?: boolean
}

export function useNavigationControl({ shouldBlockNavigation, isEditMode = false }: NavigationControlOptions) {
  const [currentAction, setCurrentAction] = useState<NavigationAction>("none")
  const isControlledActionRef = useRef(false)

  const startAction = useCallback((action: NavigationAction) => {
    isControlledActionRef.current = true
    setCurrentAction(action)
  }, [])

  const endAction = useCallback(() => {
    isControlledActionRef.current = false
    setCurrentAction("none")
  }, [])

  const shouldShowDialog = useCallback(
    (action: NavigationAction): boolean => {
      if (action === "leave" && shouldBlockNavigation) {
        return true
      }

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

