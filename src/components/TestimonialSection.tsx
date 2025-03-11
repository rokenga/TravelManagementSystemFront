import React from "react";
import { Typography, Box, Avatar, Grid } from "@mui/material";
import { styled } from "@mui/system";

const TestimonialCard = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
}));

const TestimonialSection: React.FC = () => {
  const testimonials = [
    {
      name: "Jonas Jonaitis",
      text: "Nuostabi kelionė! Profesionalus aptarnavimas ir puikiai suplanuota programa.",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    {
      name: "Ona Onaitė",
      text: "Ačiū už nepamirštamą poilsį Maldyvuose. Tikrai rekomenduosiu jūsų agentūrą draugams!",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    {
      name: "Petras Petraitis",
      text: "Kruizas viršijo visus lūkesčius. Ačiū už profesionalumą ir dėmesį detalėms.",
      avatar: "https://i.pravatar.cc/150?img=8",
    },
  ];

  return (
    <Box my={8}>
      <Typography variant="h4" align="center" gutterBottom color="primary">
        Ką sako mūsų klientai
      </Typography>
      <Grid container spacing={4} mt={2}>
        {testimonials.map((testimonial, index) => (
          <Grid item xs={12} md={4} key={index}>
            <TestimonialCard>
              <Box>
                <Avatar
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  sx={{ width: 80, height: 80, margin: "0 auto 16px" }}
                />
                <Typography variant="body1" paragraph>
                  "{testimonial.text}"
                </Typography>
              </Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {testimonial.name}
              </Typography>
            </TestimonialCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TestimonialSection;

