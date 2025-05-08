"use client"

import type React from "react"
import { useRef } from "react"
import { Container, Box } from "@mui/material"
import { styled } from "@mui/system"
import HeroSection from "../components/HeroSection"
import TripRequest from "../components/TripRequest"
import TestimonialSection from "../components/TestimonialSection"
import RecentOffers from "../components/RecentOffers"

const StyledSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 0),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(4, 0),
  },
}))

const Home: React.FC = () => {
  const tripRequestRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <HeroSection tripRequestRef={tripRequestRef} />
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Recent Offers Section (replacing Travel Categories) */}
        <RecentOffers />

        <StyledSection ref={tripRequestRef}>
          <TripRequest />
        </StyledSection>

        <TestimonialSection />
      </Container>
    </>
  )
}

export default Home
