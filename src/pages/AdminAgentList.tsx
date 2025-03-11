import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import RegisterAgentForm from "../components/RegisterAgentForm"; // Import the modal form
import { Agent } from "../types/AdminsAgent";
import { API_URL } from "../Utils/Configuration";

const AdminAgentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // New state for modal

  const navigate = useNavigate();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Agent[]>(`${API_URL}/Agent`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setAgents(response.data);
    } catch (err: any) {
      console.error("Failed to fetch agents:", err);
      setError("Nepavyko gauti agentų sąrašo.");
    } finally {
      setLoading(false);
    }
  };

  const handleAgentClick = (id: string) => {
    navigate(`/agents/${id}`);
  };

  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Agentai
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Ieškoti agentų..."
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsModalOpen(true)} // Open modal on click
        >
          + Naujas agentas
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography sx={{ mt: 2, ml: 2 }} color="error">
          {error}
        </Typography>
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {agents.length > 0 ? (
            agents
              .filter((agent) =>
                agent.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((agent) => (
                <Grid item xs={12} key={agent.id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      boxShadow: 1,
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: 2,
                        bgcolor: "action.hover",
                      },
                    }}
                    onClick={() => handleAgentClick(agent.id)}
                  >
                    <Typography variant="h6">{agent.email}</Typography>
                  </Box>
                </Grid>
              ))
          ) : (
            <Typography sx={{ mt: 2, ml: 2 }} variant="body1">
              Nėra rastų agentų.
            </Typography>
          )}
        </Grid>
      )}

      {/* Register Agent Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>Naujo agento registracija</DialogTitle>
        <DialogContent>
          <RegisterAgentForm onClose={() => setIsModalOpen(false)} onSuccess={fetchAgents} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)} color="secondary">
            Atšaukti
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAgentList;
