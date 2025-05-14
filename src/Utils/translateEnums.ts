import { TagCategory } from "../types/ClientTag"
import { TripCategory, TripStatus, PaymentStatus, OfferStatus } from "../types/ClientTrip"
import { TransportType } from "../types/Transport"
import { BoardBasisType } from "../types/Accommodation"
import { TripRequestStatus } from "../types/TripRequest"
import { PartnerType } from "../types/Partner"
import { ReservationStatus } from "../types/Reservation"



export const translateReservationStatus = (status: ReservationStatus): string => {
  switch (status) {
    case ReservationStatus.New:
      return "Nauja"
    case ReservationStatus.Contacted:
      return "Susisiekta"
    case ReservationStatus.InProgress:
      return "Vykdoma"
    case ReservationStatus.Confirmed:
      return "Patvirtinta"
    case ReservationStatus.Cancelled:
      return "Atšaukta"
    case ReservationStatus.PendingReassignment:
      return "Laukia perleidimo"
    default:
      return String(status)
  }
}

export const translatePartnerType = (type: PartnerType | string): string => {
  if (typeof type === "string") {
    switch (type) {
      case "HotelSystem":
        return "Viešbučių sistema"
      case "Guide":
        return "Gidas"
      case "DestinationPartner":
        return "Kelionių partneris"
      case "TransportCompany":
        return "Transporto įmonė"
      case "Other":
        return "Kita"
      default:
        return "Nežinomas"
    }
  }
  switch (type) {
    case PartnerType.HotelSystem:
      return "Viešbučių sistema"
    case PartnerType.Guide:
      return "Gidas"
    case PartnerType.DestinationPartner:
      return "Kelionių partneris"
    case PartnerType.TransportCompany:
      return "Transporto įmonė"
    case PartnerType.Other:
      return "Kita"
    default:
      return "Nežinomas"
  }
}

export const translateTripRequestStatus = (status: TripRequestStatus): string => {
  switch (status) {
    case TripRequestStatus.New:
      return "Nauja"
    case TripRequestStatus.Confirmed:
      return "Patvirtinta"
    case TripRequestStatus.Completed:
      return "Užbaigta"
    default:
      return String(status)
  }
}

export const translateTripCategory = (category: TripCategory): string => {
  switch (category) {
    case TripCategory.Tourist:
      return "Pažintinė"
    case TripCategory.Group:
      return "Grupinė"
    case TripCategory.Relax:
      return "Poilsinė"
    case TripCategory.Business:
      return "Verslo"
    case TripCategory.Cruise:
      return "Kruizas"
    default:
      return category
  }
}

export const translateTripStatus = (status: TripStatus): string => {
  switch (status) {
    case TripStatus.Draft:
      return "Juodraštis"
    case TripStatus.Confirmed:
      return "Patvirtinta"
    case TripStatus.Cancelled:
      return "Atšaukta"
    default:
      return status
  }
}

export const translateOfferStatus = (status: TripStatus): string => {
  switch (status) {
    case TripStatus.Draft:
      return "Juodraštis"
    case TripStatus.Confirmed:
      return "Paruoštas"
    default:
      return status
  }
}

export const translatePaymentStatus = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.Unpaid:
      return "Neapmokėta"
    case PaymentStatus.PartiallyPaid:
      return "Avansas sumokėtas"
    case PaymentStatus.Paid:
      return "Apmokėta"
    default:
      return status
  }
}

export const translateTagCategory = (category: TagCategory): string => {
  switch (category) {
    case TagCategory.TravelPreference:
      return "Kelionių pomėgiai"
    case TagCategory.TravelFrequency:
      return "Kelionių dažnumas"
    case TagCategory.DestinationInterest:
      return "Mėgstamos vietos"
    case TagCategory.SpecialRequirements:
      return "Specialūs pageidavimai"
    case TagCategory.Other:
      return "Kita"
    default:
      return category
  }
}

export const translateTransportType = (transportType: TransportType): string => {
  switch (transportType) {
    case TransportType.Flight:
      return "Skrydis"
    case TransportType.Train:
      return "Traukinys"
    case TransportType.Bus:
      return "Autobusas"
    case TransportType.Car:
      return "Automobilis"
    case TransportType.Ferry:
      return "Keltas"
    case TransportType.Cruise:
      return "Kruizas"
    default:
      return transportType
  }
}

export const translateBoardBasisType = (boardBasis: BoardBasisType): string => {
  switch (boardBasis) {
    case BoardBasisType.BedAndBreakfast:
      return "Pusryčiai įskaičiuoti"
    case BoardBasisType.HalfBoard:
      return "Pusryčiai ir vakarienė"
    case BoardBasisType.FullBoard:
      return "Pilnas maitinimas"
    case BoardBasisType.AllInclusive:
      return "Viskas įskaičiuota"
    case BoardBasisType.UltraAllInclusive:
      return "Ultra viskas įskaičiuota"
    default:
      return boardBasis
  }
}
