import { TagCategory } from "../types/ClientTag";
import { TripCategory, TripStatus, PaymentStatus } from "../types/ClientTrip";
import { TransportType } from "../types/Transport";
import { BoardBasisType } from "../types/Accommodation";

export const translateTripCategory = (category: TripCategory): string => {
  switch (category) {
    case TripCategory.Tourist:
      return "Pažintinė";
    case TripCategory.Group:
      return "Grupinė";
    case TripCategory.Relax:
      return "Poilsinė";
    case TripCategory.Business:
      return "Verslo";
    case TripCategory.Cruise:
      return "Kruizas";
    default:
      return category;
  }
};

export const translateTripStatus = (status: TripStatus): string => {
  switch (status) {
    case TripStatus.Draft:
      return "Juodraštis";
    case TripStatus.Confirmed:
      return "Patvirtinta";
    case TripStatus.Cancelled:
      return "Atšaukta";
    default:
      return status;
  }
};

export const translatePaymentStatus = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.Unpaid:
      return "Neapmokėta";
    case PaymentStatus.PartiallyPaid:
      return "Avansas sumokėtas";
    case PaymentStatus.Paid:
      return "Apmokėta";
    default:
      return status;
  }
};

export const translateTagCategory = (category: TagCategory): string => {
  switch (category) {
    case TagCategory.TravelPreference:
      return "Kelionių pomėgiai";
    case TagCategory.TravelFrequency:
      return "Kelionių dažnumas";
    case TagCategory.DestinationInterest:
      return "Mėgstamos vietos";
    case TagCategory.SpecialRequirements:
      return "Specialūs pageidavimai";
    case TagCategory.Other:
      return "Kita";
    default:
      return category;
  }
};

export const translateTransportType = (transportType: TransportType): string => {
  switch (transportType) {
    case TransportType.Flight:
      return "Skrydis";
    case TransportType.Train:
      return "Traukinys";
    case TransportType.Bus:
      return "Autobusas";
    case TransportType.Car:
      return "Automobilis";
    case TransportType.Ferry:
      return "Keltas";
    case TransportType.Cruise:
      return "Kruizas";
    default:
      return transportType;
  }
};

export const translateBoardBasisType = (boardBasis: BoardBasisType): string => {
  switch (boardBasis) {
    case BoardBasisType.BedAndBreakfast:
      return "Pusryčiai įskaičiuoti";
    case BoardBasisType.HalfBoard:
      return "Pusryčiai ir vakarienė";
    case BoardBasisType.FullBoard:
      return "Pilnas maitinimas";
    case BoardBasisType.AllInclusive:
      return "Viskas įskaičiuota";
    case BoardBasisType.UltraAllInclusive:
      return "Ultra viskas įskaičiuota";
    default:
      return boardBasis;
  }
};
