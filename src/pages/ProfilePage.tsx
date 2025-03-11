import React from "react";
import {
  Container,
  Typography,
  Box,
  //Grid,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";

const ProfilePage: React.FC = () => {
  // Mock data for the logged-in agent or admin
  const profileData = {
    name: "Roberta",
    surname: "Rukaityte",
    email: "rob.ruk@example.com",
    phoneNumber: "+37061234567",
    birthdate: "1985-05-15",
    specialization: "Italija, Poilsinės kelionės, Žiemos atostogos",
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Paskyros Informacija
      </Typography>

      {/* Profile Information */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Asmeninė Informacija
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="Vardas" secondary={profileData.name} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Pavardė" secondary={profileData.surname} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="El. paštas" secondary={profileData.email} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Telefono numeris" secondary={profileData.phoneNumber} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Gimimo data" secondary={profileData.birthdate} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Specializacija" secondary={profileData.specialization} />
          </ListItem>
        </List>
      </Paper>

      {/* Actions */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Button variant="contained" color="primary" fullWidth>
          Pranešti apie išėjimą atostogų
        </Button>
        <Button variant="contained" color="secondary" fullWidth>
          Redaguoti paskyrą
        </Button>
        <Button variant="contained" color="info" fullWidth>
          Pakeisti slaptažodį
        </Button>
        <Button variant="contained" color="error" fullWidth>
          Pašalinti paskyrą
        </Button>
      </Box>
    </Container>
  );
};

export default ProfilePage;
