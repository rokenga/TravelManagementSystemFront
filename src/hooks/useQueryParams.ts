"use client"

import { useSearchParams, useNavigate, useLocation } from "react-router-dom"
import { useCallback, useEffect, useState } from "react"
import { useNavigation } from "../contexts/NavigationContext"

export function useQueryParams<T extends Record<string, any>>() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { saveState, getState, isNavbarNavigation } = useNavigation()
  const [isInitialized, setIsInitialized] = useState(false)

  // Get all current params as an object
  const getParams = useCallback(() => {
    const params: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      // Handle arrays
      if (key.endsWith("[]")) {
        const baseKey = key.slice(0, -2)
        if (!params[baseKey]) {
          params[baseKey] = []
        }
        params[baseKey].push(value)
      } else {
        // Try to parse numbers and booleans
        if (value === "true") {
          params[key] = true
        } else if (value === "false") {
          params[key] = false
        } else if (!isNaN(Number(value)) && value !== "") {
          params[key] = Number(value)
        } else {
          params[key] = value
        }
      }
    })
    return params as T
  }, [searchParams])

  // Set multiple params at once
  const setParams = useCallback(
    (params: Partial<T>) => {
      const newParams = new URLSearchParams(searchParams)

      // Update or add new params
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          newParams.delete(key)
        } else if (Array.isArray(value)) {
          // Handle arrays
          newParams.delete(`${key}[]`)
          value.forEach((item) => {
            newParams.append(`${key}[]`, String(item))
          })
        } else {
          newParams.set(key, String(value))
        }
      })

      setSearchParams(newParams)

      // Save state to navigation context
      saveState({ queryParams: { ...getParams(), ...params } })
    },
    [searchParams, setSearchParams, getParams, saveState],
  )

  // Navigate to a new path while preserving query params
  const navigateWithParams = useCallback(
    (path: string, params?: Partial<T>) => {
      const currentParams = getParams()
      const mergedParams = { ...currentParams, ...params }

      const queryString = new URLSearchParams()

      // Ensure consistent parameter order to prevent glitching
      // First add page and pageSize
      if (mergedParams.page !== undefined) queryString.set("page", String(mergedParams.page))
      if (mergedParams.pageSize !== undefined) queryString.set("pageSize", String(mergedParams.pageSize))

      // Then add sort option
      if (mergedParams.sortOption !== undefined) queryString.set("sortOption", String(mergedParams.sortOption))

      // Then add search term
      if (mergedParams.searchTerm !== undefined && mergedParams.searchTerm !== "")
        queryString.set("searchTerm", String(mergedParams.searchTerm))

      // Then add filters
      Object.entries(mergedParams).forEach(([key, value]) => {
        if (
          key !== "page" &&
          key !== "pageSize" &&
          key !== "sortOption" &&
          key !== "searchTerm" &&
          value !== null &&
          value !== undefined &&
          value !== ""
        ) {
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (item !== null && item !== undefined && item !== "") {
                queryString.append(`${key}[]`, String(item))
              }
            })
          } else {
            queryString.set(key, String(value))
          }
        }
      })

      navigate(`${path}${queryString.toString() ? `?${queryString.toString()}` : ""}`)
    },
    [getParams, navigate],
  )

  // Initialize from saved state if available
  useEffect(() => {
    if (isInitialized) return

    // Don't restore state if this is a navbar navigation
    if (isNavbarNavigation) {
      setIsInitialized(true)
      return
    }

    const savedState = getState(location.pathname)
    if (savedState?.queryParams && Object.keys(savedState.queryParams).length > 0) {
      // Only set params if there are no existing params in the URL
      if (searchParams.toString() === "") {
        setParams(savedState.queryParams)
      }
    }

    setIsInitialized(true)
  }, [location.pathname, getState, setParams, searchParams, isInitialized, isNavbarNavigation])

  // Check for _reload parameter and handle it
  useEffect(() => {
    const reloadParam = searchParams.get("_reload")
    if (reloadParam) {
      // Remove the _reload parameter
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("_reload")

      // Update the URL without causing a navigation
      const newUrl = `${location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`
      window.history.replaceState(null, "", newUrl)

      // Force a re-render by setting a state variable
      setIsInitialized(false)
      setTimeout(() => setIsInitialized(true), 0)
    }
  }, [searchParams, location.pathname])

  return { getParams, setParams, navigateWithParams }
}

