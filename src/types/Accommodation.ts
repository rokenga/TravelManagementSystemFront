export interface AccommodationResponse {
  id: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  hotelLink?: string;
  description?: string;
  boardBasis?: BoardBasisType;
  roomType?: string;
}

export interface AccommodationRequest {
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  hotelLink?: string;
  description?: string;
  boardBasis?: BoardBasisType;
  roomType?: string;
}

export enum BoardBasisType {
  BedAndBreakfast = "BedAndBreakfast",
  HalfBoard = "HalfBoard",
  FullBoard = "FullBoard",
  AllInclusive = "AllInclusive",
  UltraAllInclusive = "UltraAllInclusive",
}