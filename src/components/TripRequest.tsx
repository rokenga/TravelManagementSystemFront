import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  InputAdornment,
  IconButton,
  Paper,
} from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import { styled } from "@mui/system";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
}));

const TripRequest: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <StyledPaper elevation={3}>
      <Typography variant="h5" align="center" gutterBottom color="primary">
        Susisieksime su Jumis per 1 val.
      </Typography>
      <Typography variant="body1" align="center" paragraph>
        ir paruošime pasiūlymą su karštomis kainomis jau per 24 val.
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Vardas"
              variant="outlined"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Telefono numeris"
              variant="outlined"
              placeholder="(999) 99-999"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton>
                      <FlagIcon />
                    </IconButton>
                    +370
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="El.pašto adresas"
              variant="outlined"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                backgroundColor: "#F58220",
                "&:hover": { backgroundColor: "#d66d0e" },
              }}
            >
              Siųsti
            </Button>
          </Grid>
        </Grid>
      </form>
      <Typography
        variant="body2"
        align="center"
        sx={{ fontSize: 14, color: "text.secondary", mt: 2 }}
      >
        Sutinku su asmens duomenų{" "}
        <a href="#" style={{ color: "#004785", textDecoration: "none" }}>
          privatumo politika
        </a>
      </Typography>
    </StyledPaper>
  );
};

export default TripRequest;

