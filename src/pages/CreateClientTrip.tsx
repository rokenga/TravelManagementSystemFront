import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

const ClientTripCreate = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    price: "",
    clientId: "",
    insurance: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Client Trip Data Submitted:", formData);
    // Add logic to send data to the backend
  };

  return (
    <Box sx={{ maxWidth: 600, margin: "auto", padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sukurti Kliento Kelionę
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label="Pavadinimas" name="name" value={formData.name} onChange={handleChange} required />
        <TextField label="Aprašymas" name="description" value={formData.description} onChange={handleChange} multiline rows={4} />
        <TextField label="Pradžios Data" name="startDate" type="date" value={formData.startDate} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
        <TextField label="Pabaigos Data" name="endDate" type="date" value={formData.endDate} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
        <TextField label="Kaina" name="price" type="number" value={formData.price} onChange={handleChange} required />
        <TextField label="Klientas" name="clientId" value={formData.clientId} onChange={handleChange} required />
        <Button type="submit" variant="contained" color="primary">Išsaugoti</Button>
      </Box>
    </Box>
  );
};

export default ClientTripCreate;
