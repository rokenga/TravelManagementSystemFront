import React from "react";
import { Box, Typography, Button } from "@mui/material";

interface ReservationCardProps {
  pricePerPerson: number;
  totalPrice: number;
  onReserve: () => void;
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  pricePerPerson,
  totalPrice,
  onReserve,
}) => {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#f9f9f9",
      }}
    >
      <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
        €{pricePerPerson} / asm.
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Kaina visiems 2 suaugę: €{totalPrice}
      </Typography>
      <Button
        variant="contained"
        fullWidth
        sx={{
          mb: 2,
          backgroundColor: "#004784", // Project-specific color
          "&:hover": {
            backgroundColor: "#003566", // Hover state
          },
        }}
        onClick={onReserve}
      >
        Rezervuoti
      </Button>
    </Box>
  );
};

export default ReservationCard;
