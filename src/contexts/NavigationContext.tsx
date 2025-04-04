"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"

// Simple state storage for each page
interface PageState {
  [key: string]: any
}

interface NavigationContextType {
  previousPath: string | null
  navigateBack: () => void
  savePageState: (pageId: string, state: any) => void
  getPageState: (pageId: string) => any
  isNavbarNavigation: boolean
  setIsNavbarNavigation: (value: boolean) => void
  navigationSource: string | null
  setNavigationSource: (source: string | null) => void
  getBackNavigationUrl: (tripId?: string | null) => string
  setSourceClientId: (clientId: string | null) => void
  getSourceClientId: () => string | null
}

const NavigationContext = createContext<NavigationContextType>({
  previousPath: null,
  navigateBack: () => {},
  savePageState: () => {},
  getPageState: () => null,
  isNavbarNavigation: false,
  setIsNavbarNavigation: () => {},
  navigationSource: null,
  setNavigationSource: () => {},
  getBackNavigationUrl: () => "/",
  setSourceClientId: () => {},
  getSourceClientId: () => null,
})

export const useNavigation = () => useContext(NavigationContext)

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Track navigation history as simple paths
  const [navigationHistory, setNavigationHistory] = useState<string[]>([])

  // Store page state in memory
  const [pageStates, setPageStates] = useState<Record<string, PageState>>({})

  // Flag for navbar navigation
  const [isNavbarNavigation, setIsNavbarNavigation] = useState(false)

  // Track navigation source (where the user came from)
  const [navigationSource, setNavigationSource] = useState<string | null>(null)

  const location = useLocation()
  const navigate = useNavigate()
  const isInitialRender = useRef(true)

  // Keep track of the last saved state to prevent unnecessary updates
  const lastSavedStateRef = useRef<Record<string, string>>({})

  // Update navigation history when location changes
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }

    const currentPath = location.pathname

    // Don't add duplicate consecutive entries
    if (navigationHistory.length === 0 || navigationHistory[navigationHistory.length - 1] !== currentPath) {
      setNavigationHistory((prev) => [...prev, currentPath])
      console.log("Navigation history updated:", [...navigationHistory, currentPath])
    }

    // Reset navbar navigation flag after navigation is complete
    setIsNavbarNavigation(false)
  }, [location.pathname, navigationHistory])

  // Navigate back to the previous path
  const navigateBack = useCallback(() => {
    // Get the current path
    const currentPath = location.pathname
    console.log("Current path:", currentPath)
    console.log("Navigation source:", navigationSource)

    // Check if we're in a trip detail page
    if (currentPath.match(/\/admin-trip-list\/[^/]+$/)) {
      // If we came from client details, go back there
      if (navigationSource === "client-details") {
        const clientId = sessionStorage.getItem("sourceClientId")
        if (clientId) {
          console.log("Navigating back to client details:", clientId)
          navigate(`/admin-client-list/${clientId}`)
          return
        }
      }

      // Otherwise go to trip list
      console.log("Navigating back to trip list")
      navigate("/admin-trip-list")
      return
    }

    // Check if we're in a trip edit page
    if (currentPath.match(/\/admin-trip-list\/[^/]+\/edit$/)) {
      // Always go back to the trip detail page
      const tripId = currentPath.split("/").slice(-2)[0]
      console.log("Navigating back to trip detail:", tripId)
      navigate(`/admin-trip-list/${tripId}`)
      return
    }

    // Check if we're in a client detail page
    if (currentPath.match(/\/admin-client-list\/[^/]+$/)) {
      // Go back to client list
      console.log("Navigating back to client list")
      navigate("/admin-client-list")
      return
    }

    // Default fallback - use history
    if (navigationHistory.length > 1) {
      const previousPath = navigationHistory[navigationHistory.length - 2]
      console.log("Navigating back to previous path:", previousPath)
      setNavigationHistory((prev) => prev.slice(0, -1))
      navigate(previousPath)
    } else {
      console.log("No previous path, navigating to home")
      navigate("/")
    }
  }, [navigationHistory, navigate, navigationSource, location.pathname])

  // Save state for a specific page
  const savePageState = useCallback((pageId: string, state: any) => {
    // Convert state to string for comparison
    const stateString = JSON.stringify(state)

    // Check if this state is different from the last saved state
    if (lastSavedStateRef.current[pageId] !== stateString) {
      console.log(`Saving state for page: ${pageId}`, state)

      // Update the last saved state reference
      lastSavedStateRef.current[pageId] = stateString

      // Update the state in the context
      setPageStates((prev) => ({
        ...prev,
        [pageId]: state,
      }))
    }
  }, [])

  // Get saved state for a page
  const getPageState = useCallback(
    (pageId: string) => {
      const state = pageStates[pageId]
      console.log(`Getting state for page: ${pageId}`, state)
      return state || null
    },
    [pageStates],
  )

  // Set the source client ID in session storage
  const setSourceClientId = useCallback((clientId: string | null) => {
    if (clientId) {
      console.log("Setting source client ID:", clientId)
      sessionStorage.setItem("sourceClientId", clientId)
    } else {
      console.log("Clearing source client ID")
      sessionStorage.removeItem("sourceClientId")
    }
  }, [])

  // Get the source client ID from session storage
  const getSourceClientId = useCallback(() => {
    return sessionStorage.getItem("sourceClientId")
  }, [])

  // Determine the correct back navigation URL based on navigation source
  const getBackNavigationUrl = useCallback(
    (tripId?: string | null) => {
      // If we have a tripId, we should always prioritize returning to that trip's detail page
      // unless we specifically want to go back to a client
      if (tripId) {
        // If we came from client details and have a client ID, we should go back to that client
        if (navigationSource === "client-details") {
          const clientId = sessionStorage.getItem("sourceClientId")
          if (clientId) {
            return `/admin-client-list/${clientId}`
          }
        }

        // Otherwise, always go back to the trip detail page
        return `/admin-trip-list/${tripId}`
      }

      // If no tripId is provided, fall back to previous behavior
      if (navigationSource === "client-details") {
        const clientId = sessionStorage.getItem("sourceClientId")
        if (clientId) {
          return `/admin-client-list/${clientId}`
        }
        return "/admin-client-list"
      }

      // Default to trip list
      return "/admin-trip-list"
    },
    [navigationSource],
  )

  // Persist navigation state to sessionStorage when it changes
  useEffect(() => {
    const navigationState = {
      pageStates,
      navigationSource,
      navigationHistory,
    }

    // Only update sessionStorage if the state has actually changed
    const currentStateString = sessionStorage.getItem("navigationState")
    const newStateString = JSON.stringify(navigationState)

    if (currentStateString !== newStateString) {
      sessionStorage.setItem("navigationState", newStateString)
    }
  }, [pageStates, navigationSource, navigationHistory])

  // Load navigation state from sessionStorage on initial render
  useEffect(() => {
    const savedState = sessionStorage.getItem("navigationState")
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        if (parsedState.pageStates) {
          setPageStates(parsedState.pageStates)

          // Initialize the lastSavedStateRef with the loaded states
          Object.entries(parsedState.pageStates).forEach(([pageId, state]) => {
            lastSavedStateRef.current[pageId] = JSON.stringify(state)
          })
        }
        if (parsedState.navigationSource) {
          setNavigationSource(parsedState.navigationSource)
        }
        if (parsedState.navigationHistory && Array.isArray(parsedState.navigationHistory)) {
          setNavigationHistory(parsedState.navigationHistory)
        }
      } catch (error) {
        console.error("Failed to parse navigation state from sessionStorage:", error)
      }
    }
  }, [])

  return (
    <NavigationContext.Provider
      value={{
        previousPath: navigationHistory.length > 1 ? navigationHistory[navigationHistory.length - 2] : null,
        navigateBack,
        savePageState,
        getPageState,
        isNavbarNavigation,
        setIsNavbarNavigation,
        navigationSource,
        setNavigationSource,
        getBackNavigationUrl,
        setSourceClientId,
        getSourceClientId,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

