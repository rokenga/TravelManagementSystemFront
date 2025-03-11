import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../Utils/Configuration";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CustomSnackbar from "../components/CustomSnackBar"; // Import your custom snackbar

const CreateClient: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    phoneNumber: "",
    email: "",
    birthday: null as Dayjs | null,
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success"); // NEW: Controls color of snackbar
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDateChange = (newDate: Dayjs | null) => {
    setFormData((prevData) => ({
      ...prevData,
      birthday: newDate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Construct payload with formatted birthday
    const payload = {
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      email: formData.email.trim(),
      notes: formData.notes.trim(),
      birthday: formData.birthday ? formData.birthday.format("YYYY-MM-DD") : null,
    };

    console.log("Submitting payload:", payload);

    try {
      const response = await axios.post(`${API_URL}/Client`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });

      if (response.status === 201) {
        setSnackbarMessage("Klientas sėkmingai sukurtas!");
        setSnackbarSeverity("success"); // ✅ Set success color
        setSnackbarOpen(true);
        setTimeout(() => navigate("/admin-client-list"), 2000);
      }
    } catch (error: any) {
      console.error("Error creating client:", error);
      
      // Check if backend provided an error response
      if (error.response) {
        console.log("Server Response:", error.response.data);
        setSnackbarMessage(error.response.data?.message || "Nepavyko sukurti kliento.");
      } else {
        setSnackbarMessage("Serverio klaida, bandykite dar kartą.");
      }

      setSnackbarSeverity("error"); // ❌ Set error color
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin-client-list");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="lt">
      <Paper
        elevation={3}
        sx={{
          maxWidth: 500,
          margin: "0 auto",
          mt: 5,
          p: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
          boxShadow: 2,
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Sukurti naują klientą
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField label="Vardas" name="name" value={formData.name} onChange={handleChange} fullWidth required />
          <TextField label="Pavardė" name="surname" value={formData.surname} onChange={handleChange} fullWidth required />
          <TextField label="Telefono numeris" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} fullWidth required />
          <TextField label="El. paštas" name="email" value={formData.email} onChange={handleChange} type="email" fullWidth required />
          <DatePicker
            label="Gimimo data"
            value={formData.birthday}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />
          <TextField label="Pastabos" name="notes" value={formData.notes} onChange={handleChange} fullWidth multiline rows={4} />

          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Button type="submit" variant="contained" color="primary" disabled={isLoading} sx={{ textTransform: "none" }}>
              {isLoading ? <CircularProgress size={24} /> : "Sukurti klientą"}
            </Button>
            <Button type="button" variant="outlined" color="secondary" onClick={handleCancel} sx={{ textTransform: "none" }}>
              Atšaukti
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 🔹 Custom Snackbar Component */}
      <CustomSnackbar open={snackbarOpen} message={snackbarMessage || ""} severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} />
    </LocalizationProvider>
  );
};

export default CreateClient;
