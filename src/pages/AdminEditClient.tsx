import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Snackbar,
  Paper,
  CircularProgress,
  Grid,
} from "@mui/material";
import { API_URL } from "../Utils/Configuration";

interface ClientFormData {
  name: string;
  surname: string;
  phoneNumber: string;
  email: string;
  birthday: string | null;
  address: string | null;
  notes: string | null;
}

const AdminEditClient: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    surname: "",
    phoneNumber: "",
    email: "",
    birthday: "",
    address: "",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Fetch client details on mount
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setError("Kliento ID nerastas.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get<ClientFormData>(
          `${API_URL}/Client/${clientId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        setFormData({
          name: response.data.name,
          surname: response.data.surname,
          phoneNumber: response.data.phoneNumber,
          email: response.data.email,
          birthday: response.data.birthday || "",
          address: response.data.address || "",
          notes: response.data.notes || "",
        });
      } catch (err: any) {
        console.error("Error fetching client data:", err);
        setError(err.response?.data?.message || "Nepavyko gauti kliento duomenų.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      await axios.put(`${API_URL}/Client/${clientId}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
      });

      setSnackbarMessage("Klientas sėkmingai atnaujintas!");
      setSnackbarOpen(true);

      setTimeout(() => navigate(`/clients/${clientId}`), 2000);
    } catch (err: any) {
      console.error("Error updating client:", err);
      setError(err.response?.data?.message || "Nepavyko atnaujinti kliento.");
      setSnackbarMessage("Klaida atnaujinant klientą.");
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/clients/${clientId}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
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
        Redaguoti klientą
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <TextField
          label="Vardas"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          fullWidth
          required
        />
        <TextField
          label="Pavardė"
          name="surname"
          value={formData.surname}
          onChange={handleInputChange}
          fullWidth
          required
        />
        <TextField
          label="Telefono numeris"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          fullWidth
          required
        />
        <TextField
          label="El. paštas"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          type="email"
          fullWidth
          required
        />
        <TextField
          label="Gimimo data"
          name="birthday"
          value={formData.birthday || ""}
          onChange={handleInputChange}
          type="date"
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="Adresas"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="Pastabos"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          fullWidth
          multiline
          rows={4}
        />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : "Išsaugoti"}
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
            >
              Atšaukti
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Paper>
  );
};

export default AdminEditClient;
