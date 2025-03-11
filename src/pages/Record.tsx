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
  Divider,
  CircularProgress,
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
import MarkdownViewer from "../components/MarkdownView";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[3],
}));

const Record: React.FC = () => {
  const User = useContext(UserContext);
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchRecordData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get(`${API_URL}/Record/${recordId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        // Corrected to set the record directly from response.data
        setRecord(response.data);
      } catch (err: any) {
        console.error("Error fetching record data:", err);
        setError("Nepavyko gauti įrašo duomenų.");
      } finally {
        setIsLoading(false);
      }
    };

    if (recordId) {
      fetchRecordData();
    }
  }, [recordId]);

  const handleDeleteRecord = async () => {
    try {
      await axios.delete(`${API_URL}/Record/${recordId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      navigate("/records"); // Fixed redirection path
    } catch (err) {
      console.error("Error deleting record:", err);
      setError("Nepavyko ištrinti įrašo.");
    }
  };

  const handleBack = () => navigate("/records"); // Fixed redirection path
  const openDeleteDialog = () => setDeleteDialogOpen(true);
  const closeDeleteDialog = () => setDeleteDialogOpen(false);

  return (
    <Box sx={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : record ? (
        <>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                  {record.title}
                </Typography>
                {(User?.role === "Admin" || User?.role === "Agent") && User?.email === record.author && (
                  <Box>
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/records/edit/${recordId}`)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={openDeleteDialog}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 2 }}>
                <Chip icon={<EventIcon />} label={`Sukurta: ${new Date(record.createdAt).toLocaleDateString()}`} />
                <Chip icon={<EventIcon />} label={`Atnaujinta: ${new Date(record.updatedAt).toLocaleDateString()}`} />
                {(User?.role === "Admin" || User?.role === "Agent") && (
                  <Chip icon={<PersonIcon />} label={`Autorius: ${record.author}`} />
                )}
              </Box>

              <Divider sx={{ my: 2 }} />
              <MarkdownViewer content={record.content} />
            </CardContent>
          </StyledCard>

          <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
            <DialogTitle>Ištrinti įrašą</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Ar tikrai norite ištrinti šį įrašą? Šis veiksmas yra negrįžtamas.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDeleteDialog} color="primary">
                Atšaukti
              </Button>
              <Button onClick={handleDeleteRecord} color="error">
                Ištrinti
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Typography>Įrašas nerastas.</Typography>
      )}
      <Button variant="outlined" onClick={handleBack} sx={{ mt: 2 }}>
        Grįžti
      </Button>
    </Box>
  );
};

export default Record;
