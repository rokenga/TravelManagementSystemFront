import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import Logo from "./Logo"
import { Key } from "react"

// Register fonts that support Lithuanian characters
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: "light",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: "medium",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    fontFamily: "Roboto",
    padding: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#004685",
    padding: 20,
    color: "white",
  },
  headerText: {
    fontSize: 10,
    color: "white",
  },
  content: {
    margin: 30,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004685",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "medium",
    color: "#004685",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: "1 solid #004685",
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: "medium",
    color: "#f58220",
    marginTop: 15,
    marginBottom: 10,
  },
  dateTitle: {
    fontSize: 12,
    fontWeight: "medium",
    color: "#f58220",
    marginTop: 10,
    marginBottom: 5,
  },
  eventContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingLeft: 10,
  },
  eventTime: {
    fontSize: 10,
    fontWeight: "bold",
    width: 40,
    marginRight: 10,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 10,
    fontWeight: "medium",
  },
  eventDescription: {
    fontSize: 9,
    color: "#666",
  },
  divider: {
    borderBottom: "0.5 solid #e0e0e0",
    marginTop: 5,
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#004685",
    fontSize: 8,
    borderTop: "1 solid #004685",
    paddingTop: 10,
  },
})

const formatDate = (dateString: string | number | Date) => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("lt-LT")
  } catch {
    return ""
  }
}

const formatTime = (dateTimeString: string | number | Date) => {
  if (!dateTimeString) return ""
  try {
    const date = new Date(dateTimeString)
    return date.toLocaleTimeString("lt-LT", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return ""
  }
}

const ClientTripPDFPreview = ({ tripData, itinerary }) => {
  const hasDescription = tripData.description && tripData.description.trim() !== ""
  const hasAdults = tripData.adultsCount > 0
  const hasChildren = tripData.childrenCount > 0

  // Process itinerary based on type (day-by-day or single day)
  const processedItinerary = tripData.dayByDayItineraryNeeded
    ? processMultiDayItinerary(itinerary)
    : processSingleDayItinerary(itinerary)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Logo />
          <View>
            <Text style={styles.headerText}>Jūsų kelionių agentūra</Text>
            <Text style={styles.headerText}>+370 123 45678</Text>
            <Text style={styles.headerText}>info@jusukeliones.lt</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{tripData.tripName || "Kelionė"}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kelionės informacija</Text>
            {tripData.startDate && tripData.endDate && (
              <Text style={styles.text}>
                Data: {formatDate(tripData.startDate)} - {formatDate(tripData.endDate)}
              </Text>
            )}
            {tripData.price && <Text style={styles.text}>Kaina: €{tripData.price}</Text>}
            {tripData.category && <Text style={styles.text}>Kategorija: {tripData.category}</Text>}
            {tripData.insuranceTaken !== undefined && (
              <Text style={styles.text}>Draudimas: {tripData.insuranceTaken ? "Taip" : "Ne"}</Text>
            )}
            {(hasAdults || hasChildren) && (
              <Text style={styles.text}>
                Keliautojų skaičius:
                {hasAdults && ` Suaugę - ${tripData.adultsCount}`}
                {hasAdults && hasChildren && ","}
                {hasChildren && ` Vaikai - ${tripData.childrenCount}`}
              </Text>
            )}
          </View>

          {hasDescription && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aprašymas</Text>
              <Text style={styles.text}>{tripData.description}</Text>
            </View>
          )}

          {processedItinerary.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Maršrutas</Text>
              {processedItinerary.map((day, index) => (
                <View key={index} wrap={false}>
                  <Text style={styles.dayTitle}>
                    {tripData.dayByDayItineraryNeeded
                      ? `Diena ${day.calculatedDayNumber} (${formatDate(day.dayLabel)})`
                      : formatDate(day.dayLabel)}
                  </Text>
                  {day.dayDescription && <Text style={styles.text}>{day.dayDescription}</Text>}
                  {day.events.map((evt: any, idx: Key | null | undefined) => (
                    <EventLine key={idx} evt={evt} />
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.footer}>
          © {new Date().getFullYear()} Jūsų kelionių agentūra | Visos teisės saugomos | www.jusukeliones.lt
        </Text>
      </Page>
    </Document>
  )
}

// Process single day itinerary (similar to SingleDayPreview in Step3ReviewConfirm)
function processSingleDayItinerary(itinerary: string | any[]) {
  if (!itinerary || itinerary.length === 0 || !itinerary[0].events || itinerary[0].events.length === 0) return []

  const day = itinerary[0]

  // Process events to get time information and create check-out/arrival events
  const processedEvents = day.events.flatMap((evt: { type: string; checkIn: string | number | Date; checkOut: string | number | Date }) => {
    const timeInfo = formatEarliestTime(evt)
    const processedEvent = { ...evt, timeInfo }

    // Handle multi-day accommodations
    if (evt.type === "accommodation" && evt.checkIn && evt.checkOut) {
      const checkInDate = new Date(evt.checkIn)
      const checkOutDate = new Date(evt.checkOut)

      if (checkInDate.toDateString() !== checkOutDate.toDateString()) {
        return [
          processedEvent,
          {
            ...evt,
            isCheckoutEvent: true,
            timeInfo: {
              ...timeInfo,
              date: checkOutDate,
              timeStr: formatTime(checkOutDate.toISOString()),
            },
          },
        ]
      }
    }
    // Handle multi-day transport or cruise
    else if ((evt.type === "transport" || evt.type === "cruise") && timeInfo.isMultiDay && timeInfo.arrivalTime) {
      return [
        {
          ...processedEvent,
          isDepartureEvent: true,
        },
        {
          ...evt,
          isArrivalEvent: true,
          timeInfo: {
            ...timeInfo,
            date: timeInfo.arrivalTime,
            timeStr: timeInfo.arrivalTimeStr,
          },
        },
      ]
    }

    return [processedEvent]
  })

  // Sort events by time
  const sortedEvents = processedEvents.sort((a: { timeInfo: { date: { getTime: () => number } } }, b: { timeInfo: { date: { getTime: () => number } } }) => {
    if (!a.timeInfo.date) return 1
    if (!b.timeInfo.date) return -1
    return a.timeInfo.date.getTime() - b.timeInfo.date.getTime()
  })

  // Group events by date
  const eventsByDate = sortedEvents.reduce((acc: { [x: string]: any[] }, evt: { timeInfo: { date: { toISOString: () => string } } }) => {
    const dateStr = evt.timeInfo.date ? evt.timeInfo.date.toISOString().split("T")[0] : "noDate"
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(evt)
    return acc
  }, {})

  return Object.entries(eventsByDate).map(([dateStr, events]) => ({
    dayLabel: dateStr,
    events: events,
    dayDescription: day.dayDescription,
  }))
}

// Process multi-day itinerary (similar to MultiDayPreview in Step3ReviewConfirm)
function processMultiDayItinerary(itinerary: { length: number; map: (arg0: (day: any) => any[]) => Iterable<readonly [unknown, unknown]> | null | undefined; forEach: (arg0: (day: any) => void) => void }) {
  if (!itinerary || itinerary.length === 0) return []

  // Create a map of all days in the itinerary
  const allDaysMap = new Map(itinerary.map((day: { dayLabel: any }) => [day.dayLabel, { ...day, events: [], calculatedDayNumber: 0 }]))

  // Process each day's events
  itinerary.forEach((day: { events: any[]; dayLabel: unknown }) => {
    if (!day.events) return

    const processedDay = allDaysMap.get(day.dayLabel)
    if (processedDay) {
      processedDay.events = day.events.map((evt: any) => {
        const timeInfo = formatEarliestTime(evt)
        return { ...evt, timeInfo }
      })
    }
  })

  // Handle multi-day events (transport/cruise arrivals and accommodation checkouts)
  allDaysMap.forEach((day, dayLabel) => {
    if (!day.events) return

    day.events.forEach((evt: { type: string; timeInfo: { isMultiDay: any; arrivalTime: string | number | Date; departureTime: string | number | Date; arrivalTimeStr: any }; isDepartureEvent: boolean; checkIn: string | number | Date; checkOut: string | number | Date }) => {
      // Handle multi-day transport or cruise
      if ((evt.type === "transport" || evt.type === "cruise") && evt.timeInfo.isMultiDay && evt.timeInfo.arrivalTime) {
        const departureDate = new Date(evt.timeInfo.departureTime)
        const arrivalDate = new Date(evt.timeInfo.arrivalTime)

        // Mark as departure event if this is the departure day
        if (dayLabel === departureDate.toISOString().split("T")[0]) {
          evt.isDepartureEvent = true
        }

        // Add arrival event to the arrival day
        const arrivalDayLabel = arrivalDate.toISOString().split("T")[0]
        if (arrivalDayLabel !== dayLabel) {
          let arrivalDay = allDaysMap.get(arrivalDayLabel)
          if (!arrivalDay) {
            // Create a new day if it doesn't exist
            arrivalDay = {
              dayLabel: arrivalDayLabel,
              events: [],
              dayDescription: "",
            }
            allDaysMap.set(arrivalDayLabel, arrivalDay)
          }

          // Add arrival event
          arrivalDay.events.push({
            ...evt,
            isArrivalEvent: true,
            timeInfo: {
              ...evt.timeInfo,
              date: arrivalDate,
              timeStr: evt.timeInfo.arrivalTimeStr,
            },
          })
        }
      }

      // Handle multi-day accommodations
      else if (evt.type === "accommodation" && evt.checkIn && evt.checkOut) {
        const checkInDate = new Date(evt.checkIn)
        const checkOutDate = new Date(evt.checkOut)

        if (checkInDate.toDateString() !== checkOutDate.toDateString()) {
          const checkoutDayLabel = checkOutDate.toISOString().split("T")[0]

          if (checkoutDayLabel !== dayLabel) {
            let checkoutDay = allDaysMap.get(checkoutDayLabel)
            if (!checkoutDay) {
              // Create a new day if it doesn't exist
              checkoutDay = {
                dayLabel: checkoutDayLabel,
                events: [],
                dayDescription: "",
              }
              allDaysMap.set(checkoutDayLabel, checkoutDay)
            }

            // Add checkout event
            checkoutDay.events.push({
              ...evt,
              isCheckoutEvent: true,
              timeInfo: {
                ...evt.timeInfo,
                date: checkOutDate,
                timeStr: formatTime(checkOutDate.toISOString()),
              },
            })
          }
        }
      }
    })
  })

  // Convert map to array, sort by date, and calculate day numbers
  const sortedDays = Array.from(allDaysMap.values())
    .filter((day) => day.events && (day.events.length > 0 || day.dayDescription))
    .sort((a, b) => new Date(a.dayLabel).getTime() - new Date(b.dayLabel).getTime())

  if (sortedDays.length === 0) return []

  // Calculate day numbers based on chronological order
  const startDate = new Date(sortedDays[0].dayLabel)
  const finalDays = sortedDays.map((day) => {
    const currentDate = new Date(day.dayLabel)
    const dayNumber = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Sort events within each day
    const sortedEvents = day.events.sort((a: { timeInfo: { date: { getTime: () => number } } }, b: { timeInfo: { date: { getTime: () => number } } }) => {
      if (!a.timeInfo.date) return 1
      if (!b.timeInfo.date) return -1
      return a.timeInfo.date.getTime() - b.timeInfo.date.getTime()
    })

    return {
      ...day,
      calculatedDayNumber: dayNumber,
      events: sortedEvents,
    }
  })

  return finalDays
}

// Component to render a single event line in the PDF
const EventLine = ({ evt }) => {
  // Determine the time string to display
  const timeStr = evt.isArrivalEvent
    ? evt.timeInfo.arrivalTimeStr
    : evt.isCheckoutEvent
      ? evt.timeInfo.timeStr
      : evt.timeInfo.timeStr

  // Build the main event text
  let eventTitle = ""

  if (evt.type === "transport" || evt.type === "cruise") {
    if (evt.isArrivalEvent) {
      eventTitle = "Atvykimas: " + transportLine(evt)
    } else if (evt.isDepartureEvent) {
      eventTitle = "Išvykimas: " + transportLine(evt)
    } else {
      eventTitle = transportLine(evt)
    }
  } else if (evt.type === "accommodation") {
    if (evt.isCheckoutEvent) {
      eventTitle = `Išsiregistravimas iš ${evt.hotelName || "viešbučio"}`
    } else {
      eventTitle = `Įsiregistravimas: ${evt.hotelName || "viešbutis"}`
    }
  } else if (evt.type === "activity") {
    eventTitle = evt.description || "Veikla"
  } else {
    eventTitle = evt.description || "Kita veikla"
  }

  return (
    <View style={styles.eventContainer}>
      <Text style={styles.eventTime}>{timeStr}</Text>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{eventTitle}</Text>

        {/* Show description for non-activity events */}
        {evt.description && evt.type !== "activity" && <Text style={styles.eventDescription}>{evt.description}</Text>}

        {/* Show multi-day indicator for transport */}
        {evt.type === "transport" && evt.timeInfo.isMultiDay && evt.isDepartureEvent && (
          <Text style={styles.eventDescription}>(Kelių dienų kelionė)</Text>
        )}

        <View style={styles.divider} />
      </View>
    </View>
  )
}

// Helper function to format transport event text
function transportLine(e: { departurePlace: string; arrivalPlace: string; type: string; transportName: any; transportType: string }) {
  const from = e.departurePlace || "?"
  const to = e.arrivalPlace || "?"

  // Map transport type to Lithuanian label
  const transportTypes = [
    { value: "flight", label: "Skrydis" },
    { value: "train", label: "Traukinys" },
    { value: "bus", label: "Autobusas" },
    { value: "car", label: "Automobilis" },
    { value: "ferry", label: "Keltas" },
  ]

  let typeLabel = "Transportas"
  if (e.type === "cruise") {
    typeLabel = "Kruizas"
    if (e.transportName) {
      typeLabel += ` "${e.transportName}"`
    }
  } else {
    const typeObj = transportTypes.find((t) => t.value === e.transportType)
    if (typeObj) {
      typeLabel = typeObj.label
    }
  }

  return `${typeLabel} iš ${from} į ${to}`
}

// Helper function to extract time information from events
function formatEarliestTime(e: { type: string; departureTime: string | number | Date; arrivalTime: string | number | Date; checkIn: string | number | Date; checkOut: string | number | Date; activityTime: string | number | Date }) {
  let departureTime = null
  let arrivalTime = null
  let departureTimeStr = ""
  let arrivalTimeStr = ""

  // Get departure and arrival times for transport and cruise
  if (e.type === "transport" || e.type === "cruise") {
    if (e.departureTime) {
      departureTime = new Date(e.departureTime)
      departureTimeStr = formatTime(e.departureTime)
    }
    if (e.arrivalTime) {
      arrivalTime = new Date(e.arrivalTime)
      arrivalTimeStr = formatTime(e.arrivalTime)
    }
  }

  // Collect all valid times for finding the earliest
  const times = []
  if (e.departureTime) times.push(new Date(e.departureTime))
  if (e.arrivalTime) times.push(new Date(e.arrivalTime))
  if (e.checkIn) times.push(new Date(e.checkIn))
  if (e.checkOut) times.push(new Date(e.checkOut))
  if (e.activityTime) times.push(new Date(e.activityTime))

  const validTimes = times.filter((time) => !isNaN(time.getTime()))

  if (validTimes.length === 0) {
    return {
      timeStr: "",
      date: null,
      departureTime,
      departureTimeStr,
      arrivalTime,
      arrivalTimeStr,
      isMultiDay: false,
    }
  }

  // Find earliest time
  const earliest = new Date(Math.min(...validTimes.map((d) => d.getTime())))

  // Check if transport or cruise spans multiple days
  const isMultiDay = departureTime && arrivalTime && departureTime.toDateString() !== arrivalTime.toDateString()

  return {
    timeStr: formatTime(earliest.toISOString()),
    date: earliest,
    departureTime,
    departureTimeStr,
    arrivalTime,
    arrivalTimeStr,
    isMultiDay,
  }
}

export default ClientTripPDFPreview

