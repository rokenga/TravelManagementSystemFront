import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../Utils/Configuration";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Container,
  Paper,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import UserContext from "../contexts/UserContext";
import { DestinationWithAllRecordsResponse } from "../types/Destination";
import { RecordResponse } from "../types/Record";
import MarkdownViewer from "../components/MarkdownView";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from '@mui/icons-material/Add';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  boxShadow: theme.shadows[1],
}));

const Destination: React.FC = () => {
  const User = useContext(UserContext);
  const { destinationId } = useParams<{ destinationId: string }>();
  const navigate = useNavigate();

  const [destination, setDestination] = useState<DestinationWithAllRecordsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchDestinationData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get<DestinationWithAllRecordsResponse>(
          `${API_URL}/Destination/${destinationId}/Records`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        setDestination(response.data);
      } catch (err: any) {
        console.error("Error fetching destination data:", err);

        if (err.response && err.response.status === 404) {
          setError("Kelionės kryptis nerasta.");
        } else {
          setError(err.response?.data?.message || "Nepavyko gauti kelionės krypties duomenų.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (destinationId) {
      fetchDestinationData();
    }
  }, [destinationId]);

  const handleBack = () => {
    navigate(`/destinations`);
  };

  const handleDeleteDestination = async () => {
    try {
      await axios.delete(`${API_URL}/Destination/${destinationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      navigate("/destinations");
    } catch (error) {
      console.error("Error deleting destination:", error);
      // Handle error appropriately, e.g., display an error message
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Box sx={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      ) : destination ? (
        <>
          <Card sx={{ marginBottom: "20px" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h4">
                  {destination.city}, {destination.country}
                </Typography>
                {(User?.role === "Admin" || User?.role === "Agent") && (
                  <Box>
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/destination/edit/${destination.id}`)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    {User?.role === "Admin" && (
                      <IconButton
                        color="error"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 2 }}>
                <MarkdownViewer content={destination.description} />
              </Box>
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <DialogTitle id="delete-dialog-title">Ištrinti kryptį</DialogTitle>
            <DialogContent>
              <DialogContentText id="delete-dialog-description">
                Ar tikrai norite ištrinti šią kryptį? Tuo pačiu ištrinsite ir visus įrašus ir komentarus. Šis veiksmas yra negrįžtamas.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDeleteDestination} color="error" autoFocus>
                Ištrinti
              </Button>
              <Button onClick={() => setIsDeleteDialogOpen(false)} color="primary">
                Atšaukti
              </Button>
            </DialogActions>
          </Dialog>

          <StyledPaper elevation={3}>
            {/* Add Record Button */}
            {(User?.role === "Admin" || User?.role === "Agent") && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />} // Add the plus icon

                    onClick={() => navigate(`/destination/${destinationId}/create`)}
                >
                    Pridėti įrašą
                </Button>
                </Box>
            )}

            {/* Record List */}
            <Typography variant="h5" gutterBottom>
                Įrašai:
            </Typography>

            {destination.records && destination.records.length > 0 ? (
              <List>
              {destination.records.map((record: RecordResponse) => (
                <StyledListItem
                  key={record.id}
                  onClick={() => navigate(`/destination/${destination.id}/records/${record.id}`)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)", // Light hover effect
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6" color="primary">
                        {record.title}
                      </Typography>
                    }
                    secondary={
                      <Grid container spacing={1}>
                        {/* Conditionally display Author */}
                        {(User?.role === "Admin" || User?.role === "Agent") && (
                          <Grid item>
                            <Chip
                              icon={<PersonIcon />}
                              label={`Autorius: ${record.author}`}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          </Grid>
                        )}
            
                        {/* Always display UpdatedAt */}
                        <Grid item>
                          <Chip
                            icon={<EventIcon />}
                            label={`Atnaujinta: ${new Date(record.updatedAt).toLocaleDateString()}`}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        </Grid>
            
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            {record.content.substring(0, 100)}...
                          </Typography>
                        </Grid>
                      </Grid>
                    }
                  />
                </StyledListItem>
              ))}
            </List>            
            ) : (
              <Typography variant="body1">Šioje kelionės kryptyje nėra įrašų.</Typography>
            )}
          </StyledPaper>
        </>
      ) : (
        <Typography variant="h6">Kelionės kryptis nerasta.</Typography>
      )}
      <Button variant="text" onClick={handleBack} sx={{ marginTop: "20px" }}>
        Grįžti
      </Button>
    </Box>
  );
};

export default Destination;

