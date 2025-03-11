import React from "react";
import { Card, CardContent, CardMedia, Typography, Button, Box } from "@mui/material";
import { styled } from "@mui/system";

interface TravelCategoryProps {
  image: string;
  title: string;
  description: string;
}

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)",
  },
}));

const TravelCategory: React.FC<TravelCategoryProps> = ({ image, title, description }) => {
  return (
    <StyledCard>
      <CardMedia component="img" height="200" image={image} alt={title} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>
      </CardContent>
    </StyledCard>
  );
};

export default TravelCategory;

