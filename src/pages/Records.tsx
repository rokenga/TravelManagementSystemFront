import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../Utils/Configuration";
import { UserContext } from "../contexts/UserContext";

import {
  CssBaseline,
  Box,
  Button,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

interface RecordInfo {
  id: string;
  title: string;
  createdAt: Date;
}

function Records() {
  const [records, setRecords] = useState<RecordInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const role = user?.role;

  console.log("Current user role:", role);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await axios.get(API_URL + "/Record");
        if (response.status === 200) {
          setRecords(response.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        {/* Main Content */}
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Įrašai
          </Typography>

          {/* Top Bar for Admin/Agent Button */}
          {(role === "Admin" || role === "Agent") && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                my: 2, // Adds margin top and bottom
              }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate("/records/create")}
              >
                Pridėti
              </Button>
            </Box>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : records.length > 0 ? (
            <Grid container spacing={3}>
              {records.map((record) => (
                <Grid item xs={12} sm={6} md={4} key={record.id}>
                  <Card
                    elevation={3}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "0.3s",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h5" component="div">
                        {record.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sukurta: {new Date(record.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        onClick={() => navigate(`/records/${record.id}`)}
                      >
                        Peržiūrėti
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                Nėra sukurtų įrašų
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default Records;
