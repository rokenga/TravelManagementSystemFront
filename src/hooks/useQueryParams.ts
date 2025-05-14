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

  const getParams = useCallback(() => {
    const params: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      if (key.endsWith("[]")) {
        const baseKey = key.slice(0, -2)
        if (!params[baseKey]) {
          params[baseKey] = []
        }
        params[baseKey].push(value)
      } else {
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

  const setParams = useCallback(
    (params: Partial<T>) => {
      const newParams = new URLSearchParams(searchParams)

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          newParams.delete(key)
        } else if (Array.isArray(value)) {
          newParams.delete(`${key}[]`)
          value.forEach((item) => {
            newParams.append(`${key}[]`, String(item))
          })
        } else {
          newParams.set(key, String(value))
        }
      })

      setSearchParams(newParams)

      saveState({ queryParams: { ...getParams(), ...params } })
    },
    [searchParams, setSearchParams, getParams, saveState],
  )

  const navigateWithParams = useCallback(
    (path: string, params?: Partial<T>) => {
      const currentParams = getParams()
      const mergedParams = { ...currentParams, ...params }

      const queryString = new URLSearchParams()

      if (mergedParams.page !== undefined) queryString.set("page", String(mergedParams.page))
      if (mergedParams.pageSize !== undefined) queryString.set("pageSize", String(mergedParams.pageSize))
      if (mergedParams.sortOption !== undefined) queryString.set("sortOption", String(mergedParams.sortOption))

      if (mergedParams.searchTerm !== undefined && mergedParams.searchTerm !== "")
        queryString.set("searchTerm", String(mergedParams.searchTerm))

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

  useEffect(() => {
    if (isInitialized) return

    if (isNavbarNavigation) {
      setIsInitialized(true)
      return
    }

    const savedState = getState(location.pathname)
    if (savedState?.queryParams && Object.keys(savedState.queryParams).length > 0) {
      if (searchParams.toString() === "") {
        setParams(savedState.queryParams)
      }
    }

    setIsInitialized(true)
  }, [location.pathname, getState, setParams, searchParams, isInitialized, isNavbarNavigation])

  useEffect(() => {
    const reloadParam = searchParams.get("_reload")
    if (reloadParam) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("_reload")

      const newUrl = `${location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`
      window.history.replaceState(null, "", newUrl)

      setIsInitialized(false)
      setTimeout(() => setIsInitialized(true), 0)
    }
  }, [searchParams, location.pathname])

  return { getParams, setParams, navigateWithParams }
}

