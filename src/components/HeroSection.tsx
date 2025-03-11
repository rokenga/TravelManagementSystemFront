import React, { useEffect, useState } from "react";
import { Box, Typography, Container, IconButton, Button } from "@mui/material";
import { styled } from "@mui/system";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import GroupsIcon from "@mui/icons-material/Groups";
import CruiseIcon from "@mui/icons-material/DirectionsBoat";
import CouplesIcon from "@mui/icons-material/Favorite";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import exoticImage from "../assets/HomePage.jpg";

const HeroContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  height: "100vh",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textAlign: "center",
  flexDirection: "column",
}));

const ParallaxBackground = styled(Box)<{ offset: number }>(({ theme, offset }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: `url(${exoticImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  transform: `translateY(${offset}px)`,
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
}));

const HeroContent = styled(Container)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  textAlign: "center",
}));

const IconSection = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  gap: theme.spacing(4),
  marginTop: theme.spacing(4),
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  textAlign: "center",
  color: "white",
}));

const HeroSection: React.FC<{ tripRequestRef: React.RefObject<HTMLDivElement> }> = ({
  tripRequestRef,
}) => {
  const [offset, setOffset] = useState(0);

  const handleScrollToForm = () => {
    if (tripRequestRef.current) {
      tripRequestRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <HeroContainer>
      <ParallaxBackground offset={offset * 0.5} />
      <HeroContent>
        <Typography variant="h2" component="h1" gutterBottom>
          Jūsų svajonių kelionė prasideda su mumis
        </Typography>
        <Typography variant="h5" paragraph>
          Pasirūpinsime viskuo: skrydžiai, viešbučiai, pervežimai, draudimas, vizos ir kitos paslaugos
        </Typography>

        {/* Icon Section */}
        <IconSection>
          <IconWrapper>
            <IconButton>
              <CouplesIcon sx={{ fontSize: "3rem", color: "white" }} />
            </IconButton>
            <Typography variant="body2">Poroms</Typography>
          </IconWrapper>
          <IconWrapper>
            <IconButton>
              <FamilyRestroomIcon sx={{ fontSize: "3rem", color: "white" }} />
            </IconButton>
            <Typography variant="body2">Šeimoms</Typography>
          </IconWrapper>
          <IconWrapper>
            <IconButton>
              <GroupsIcon sx={{ fontSize: "3rem", color: "white" }} />
            </IconButton>
            <Typography variant="body2">Grupėms</Typography>
          </IconWrapper>
          <IconWrapper>
            <IconButton>
              <CruiseIcon sx={{ fontSize: "3rem", color: "white" }} />
            </IconButton>
            <Typography variant="body2">Liukso klasė</Typography>
          </IconWrapper>
        </IconSection>

        {/* Scroll Button */}
        <Button
          variant="contained"
          sx={{
            mt: 4,
            backgroundColor: "#F58220",
            color: "white",
            fontSize: "1.5rem",
            padding: "1rem 2rem",
            display: "flex",
            alignItems: "center",
            "&:hover": { backgroundColor: "#d66d0e" },
          }}
          onClick={handleScrollToForm}
        >
          Gauti pasiūlymą
          <KeyboardArrowDownIcon sx={{ ml: 1, fontSize: "2rem" }} />
        </Button>
      </HeroContent>
    </HeroContainer>
  );
};

export default HeroSection;
