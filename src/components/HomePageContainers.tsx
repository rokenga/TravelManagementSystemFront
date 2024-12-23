import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { styled } from "@mui/system";

// Styled Component for the image container
const ImageContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius,
  img: {
    width: "100%",
    height: "auto",
    display: "block",
  },
}));

// PictureText Component
interface HomePageContainerProps {
  imagePath: string;
  title: string;
  description: string;
}

const HomePageContainer: React.FC<HomePageContainerProps> = ({ imagePath, title, description }) => {
  return (
    <Paper elevation={3} sx={{ overflow: "hidden", position: "relative", height: "100%" }}>
      {/* Image Section */}
      <ImageContainer>
        <img src={imagePath} alt={title} />
      </ImageContainer>
      {/* Text Section */}
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1">{description}</Typography>
      </Box>
    </Paper>
  );
};

export default HomePageContainer;
