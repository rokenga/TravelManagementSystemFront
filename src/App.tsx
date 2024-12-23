import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Destinations from "./pages/Destinations";
import Destination from "./pages/Destination";
import CreateDestination from "./pages/CreateDestination";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import axios from "axios";
import { API_URL } from "./Utils/Configuration";
import UserContext from "./contexts/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Container, CssBaseline } from "@mui/material";
import EditDestination from "./pages/EditDestination";
import CreateRecord from "./pages/CreateRecord";
import Record from "./pages/Record";
import EditRecord from "./pages/EditRecord";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({ id: "", email: "", role: null });

  // Check login status
  useEffect(() => {
    const checkLoginStatus = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/Auth/getUser`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (response.status === 200) {
          setIsLoggedIn(true);
          setUser(response.data);
        }
      } catch (error) {
        console.error("Error checking login status", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
    setUser({ id: "", email: "", role: null });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Router>
      <UserContext.Provider value={user}>
        <CssBaseline />
        <Container className="app-container" disableGutters maxWidth={false}>
          <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <div className="content-wrap">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/destination/:destinationId/records/:recordId" element={<Record />} />



              {/* Admin and Agent Only */}
              <Route element={<ProtectedRoute requiredRoles={["Admin", "Agent"]} />}>
                <Route path="/destination/:destinationId/create" element={<CreateRecord />} />
                <Route path="/destination/create" element={<CreateDestination />} />
                <Route path="/destination/edit/:destinationId" element={<EditDestination />} />
                <Route path="/destination/:destinationId/records/edit/:recordId" element={<EditRecord />} />


              </Route>

              {/* General Route for Destination */}
              <Route path="/destination/:destinationId" element={<Destination />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            </div>
            </Navbar>
          <Footer />
        </Container>
      </UserContext.Provider>
    </Router>
  );
}

export default App;
