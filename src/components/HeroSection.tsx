"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Box, Typography, Container, IconButton, Button, useMediaQuery, useTheme } from "@mui/material"
import { styled } from "@mui/system"
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom"
import GroupsIcon from "@mui/icons-material/Groups"
import CruiseIcon from "@mui/icons-material/DirectionsBoat"
import CouplesIcon from "@mui/icons-material/Favorite"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import exoticImage from "../assets/HomePage.jpg"

const HeroContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  height: "100vh",
  minHeight: "500px", // Ensure minimum height on small screens
  maxHeight: "900px", // Cap maximum height on very large screens
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textAlign: "center",
  flexDirection: "column",
}))

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
}))

const HeroContent = styled(Container)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  textAlign: "center",
  padding: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5),
  },
}))

const IconSection = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap", // Allow wrapping on small screens
  gap: theme.spacing(4),
  marginTop: theme.spacing(4),
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
}))

const IconWrapper = styled(Box)(({ theme }) => ({
  textAlign: "center",
  color: "white",
  margin: theme.spacing(1),
}))

const HeroSection: React.FC<{ tripRequestRef: React.RefObject<HTMLDivElement> }> = ({ tripRequestRef }) => {
  const [offset, setOffset] = useState(0)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))

  const handleScrollToForm = () => {
    if (tripRequestRef.current) {
      tripRequestRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <HeroContainer>
      <ParallaxBackground offset={offset * 0.5} />
      <HeroContent maxWidth="lg">
        <Typography
          variant={isMobile ? "h4" : isTablet ? "h3" : "h2"}
          component="h1"
          gutterBottom
          sx={{
            fontWeight: "bold",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            fontSize: {
              xs: "1.75rem",
              sm: "2.25rem",
              md: "3rem",
              lg: "3.75rem",
            },
          }}
        >
          Jūsų svajonių kelionė prasideda su mumis
        </Typography>
        <Typography
          variant={isMobile ? "body1" : "h5"}
          paragraph
          sx={{
            maxWidth: "800px",
            mx: "auto",
            fontSize: {
              xs: "0.875rem",
              sm: "1rem",
              md: "1.25rem",
            },
          }}
        >
          Pasirūpinsime viskuo: skrydžiai, viešbučiai, pervežimai, draudimas, vizos ir kitos paslaugos
        </Typography>

        {/* Icon Section */}
        <IconSection>
          <IconWrapper>
            <IconButton>
              <CouplesIcon
                sx={{
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                  color: "white",
                }}
              />
            </IconButton>
            <Typography variant="body2">Poroms</Typography>
          </IconWrapper>
          <IconWrapper>
            <IconButton>
              <FamilyRestroomIcon
                sx={{
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                  color: "white",
                }}
              />
            </IconButton>
            <Typography variant="body2">Šeimoms</Typography>
          </IconWrapper>
          <IconWrapper>
            <IconButton>
              <GroupsIcon
                sx={{
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                  color: "white",
                }}
              />
            </IconButton>
            <Typography variant="body2">Grupėms</Typography>
          </IconWrapper>
          <IconWrapper>
            <IconButton>
              <CruiseIcon
                sx={{
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                  color: "white",
                }}
              />
            </IconButton>
            <Typography variant="body2">Liukso klasė</Typography>
          </IconWrapper>
        </IconSection>

        {/* Scroll Button */}
        <Button
          variant="contained"
          sx={{
            mt: { xs: 2, sm: 3, md: 4 },
            backgroundColor: "#F58220",
            color: "white",
            fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
            padding: { xs: "0.5rem 1rem", sm: "0.75rem 1.5rem", md: "1rem 2rem" },
            display: "flex",
            alignItems: "center",
            "&:hover": { backgroundColor: "#d66d0e" },
          }}
          onClick={handleScrollToForm}
        >
          Gauti pasiūlymą
          <KeyboardArrowDownIcon sx={{ ml: 1, fontSize: { xs: "1.5rem", md: "2rem" } }} />
        </Button>
      </HeroContent>
    </HeroContainer>
  )
}

export default HeroSection
