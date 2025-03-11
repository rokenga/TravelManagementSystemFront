import React, { useState } from "react";
import { TextField, Button, Box, CircularProgress, Typography } from "@mui/material";
import axios from "axios";
import { API_URL } from "../Utils/Configuration";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const RegisterAgentForm: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) =>
    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError("Neteisingas el. pašto adresas");
      return;
    }

    if (password.length < 6) {
      setError("Slaptažodis turi būti bent 6 simbolių");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/Auth/register`,
        { email, password },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to register agent:", err);
      setError("Nepavyko užregistruoti agento. Patikrinkite duomenis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="El. paštas"
        variant="outlined"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={!!error}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Laikinas slaptažodis"
        type="password"
        variant="outlined"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={!!error}
        sx={{ mb: 2 }}
      />
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : "Registruoti agentą"}
      </Button>
    </Box>
  );
};

export default RegisterAgentForm;
