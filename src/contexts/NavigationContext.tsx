"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"

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
  const [navigationHistory, setNavigationHistory] = useState<string[]>([])

  const [pageStates, setPageStates] = useState<Record<string, PageState>>({})

  const [isNavbarNavigation, setIsNavbarNavigation] = useState(false)

  const [navigationSource, setNavigationSource] = useState<string | null>(null)

  const location = useLocation()
  const navigate = useNavigate()
  const isInitialRender = useRef(true)

  const lastSavedStateRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }

    const currentPath = location.pathname

    if (navigationHistory.length === 0 || navigationHistory[navigationHistory.length - 1] !== currentPath) {
      setNavigationHistory((prev) => [...prev, currentPath])
    }

    setIsNavbarNavigation(false)
  }, [location.pathname, navigationHistory])

  const navigateBack = useCallback(() => {
    const currentPath = location.pathname

    if (currentPath.match(/\/admin-trip-list\/[^/]+$/)) {
      if (navigationSource === "client-details") {
        const clientId = sessionStorage.getItem("sourceClientId")
        if (clientId) {
          navigate(`/admin-client-list/${clientId}`)
          return
        }
      }

      navigate("/admin-trip-list")
      return
    }

    if (currentPath.match(/\/admin-trip-list\/[^/]+\/edit$/)) {
      const tripId = currentPath.split("/").slice(-2)[0]
      navigate(`/admin-trip-list/${tripId}`)
      return
    }

    if (currentPath.match(/\/admin-client-list\/[^/]+$/)) {
      navigate("/admin-client-list")
      return
    }

    if (navigationHistory.length > 1) {
      const previousPath = navigationHistory[navigationHistory.length - 2]
      setNavigationHistory((prev) => prev.slice(0, -1))
      navigate(previousPath)
    } else {
      navigate("/")
    }
  }, [navigationHistory, navigate, navigationSource, location.pathname])

  const savePageState = useCallback((pageId: string, state: any) => {
    const stateString = JSON.stringify(state)

    if (lastSavedStateRef.current[pageId] !== stateString) {

      lastSavedStateRef.current[pageId] = stateString

      setPageStates((prev) => ({
        ...prev,
        [pageId]: state,
      }))
    }
  }, [])

  const getPageState = useCallback(
    (pageId: string) => {
      const state = pageStates[pageId]
      return state || null
    },
    [pageStates],
  )

  const setSourceClientId = useCallback((clientId: string | null) => {
    if (clientId) {
      sessionStorage.setItem("sourceClientId", clientId)
    } else {
      sessionStorage.removeItem("sourceClientId")
    }
  }, [])

  const getSourceClientId = useCallback(() => {
    return sessionStorage.getItem("sourceClientId")
  }, [])

  const getBackNavigationUrl = useCallback(
    (tripId?: string | null) => {

      if (tripId) {
        if (navigationSource === "client-details") {
          const clientId = sessionStorage.getItem("sourceClientId")
          if (clientId) {
            return `/admin-client-list/${clientId}`
          }
        }

        return `/admin-trip-list/${tripId}`
      }

      if (navigationSource === "client-details") {
        const clientId = sessionStorage.getItem("sourceClientId")
        if (clientId) {
          return `/admin-client-list/${clientId}`
        }
        return "/admin-client-list"
      }

      return "/admin-trip-list"
    },
    [navigationSource],
  )

  useEffect(() => {
    const navigationState = {
      pageStates,
      navigationSource,
      navigationHistory,
    }

    const currentStateString = sessionStorage.getItem("navigationState")
    const newStateString = JSON.stringify(navigationState)

    if (currentStateString !== newStateString) {
      sessionStorage.setItem("navigationState", newStateString)
    }
  }, [pageStates, navigationSource, navigationHistory])

  useEffect(() => {
    const savedState = sessionStorage.getItem("navigationState")
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        if (parsedState.pageStates) {
          setPageStates(parsedState.pageStates)

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

