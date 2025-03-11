"use client"

import { useState } from "react"
import {
  createTransportEvent,
  createAccommodationEvent,
  createActivityEvent,
  createCruiseEvent,
} from "../Utils/eventFactory"

interface Day {
  dayLabel: string
  dayDescription: string
  events: any[]
}

export function useItineraryEvents(initialItinerary: Day[]) {
  const [itinerary, setItinerary] = useState<Day[]>(initialItinerary)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  // Get current day
  const currentDay = itinerary[selectedDayIndex] || {
    dayLabel: "",
    dayDescription: "",
    events: [],
  }

  // Add events
  const addTransport = () => {
    addEventToCurrentDay(createTransportEvent())
  }

  const addAccommodation = () => {
    addEventToCurrentDay(createAccommodationEvent())
  }

  const addActivity = () => {
    addEventToCurrentDay(createActivityEvent())
  }

  const addCruise = () => {
    addEventToCurrentDay(createCruiseEvent())
  }

  const addEventToCurrentDay = (newEvent: any) => {
    const updated = [...itinerary]
    updated[selectedDayIndex].events.push(newEvent)
    setItinerary(updated)
  }

  // Remove event from day
  const removeEvent = (dayIndex: number, eventIndex: number) => {
    const updated = [...itinerary]
    updated[dayIndex].events.splice(eventIndex, 1)
    setItinerary(updated)
  }

  // Day description
  const handleDayDescriptionChange = (dayIndex: number, value: string) => {
    const updated = [...itinerary]
    updated[dayIndex].dayDescription = value
    setItinerary(updated)
  }

  // If user edits an event, update state
  const handleEventChange = (dayIndex: number, eventIndex: number, field: string, value: any) => {
    const updated = [...itinerary]
    updated[dayIndex].events[eventIndex] = {
      ...updated[dayIndex].events[eventIndex],
      [field]: value,
    }
    setItinerary(updated)
  }

  // Navigate to next/previous day
  const goToNextDay = () => {
    if (selectedDayIndex < itinerary.length - 1) {
      setSelectedDayIndex(selectedDayIndex + 1)
    }
  }

  const goToPreviousDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1)
    }
  }

  return {
    itinerary,
    setItinerary,
    selectedDayIndex,
    setSelectedDayIndex,
    currentDay,
    addTransport,
    addAccommodation,
    addActivity,
    addCruise,
    removeEvent,
    handleDayDescriptionChange,
    handleEventChange,
    goToNextDay,
    goToPreviousDay,
  }
}

