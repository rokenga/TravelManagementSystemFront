import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Records from "./pages/Records";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import axios from "axios";
import { API_URL } from "./Utils/Configuration";
import UserContext from "./contexts/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Container, CssBaseline } from "@mui/material";
import CreateRecord from "./pages/CreateRecord";
import Record from "./pages/Record";
import EditRecord from "./pages/EditRecord";
import SpecialOffers from "./pages/SpecialOffers";
import SpecialOfferDetails from "./pages/SpecialOfferDetails";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./Theme";
import AdminClientList from "./pages/AdminClientList";
import AdminTripList from "./pages/AdminTripList";
import SpecialOfferCreate from "./pages/CreateSpecialOfferTrip";
import CruiseTripCreate from "./pages/CreateCruiseTrip";
import ClientTrip from "./pages/ClientTrip";
import ProfilePage from "./pages/ProfilePage";
import Workspace from "./pages/Workspace";
import CreateClient from "./pages/CreateClient";
import AdminEditClient from "./pages/AdminEditClient";
import AdminSpecialOffers from "./pages/AdminSpecialOffers";

import WizardForm from "./pages/WizardFormPage";
import ClientDetail from "./pages/ClientDetail";
import SpecialOfferReservation from "./pages/SpecialOfferReservation";

import AdminAgentList from "./pages/AdminAgentList";
import AgentDetail from "./pages/AgentDetails";
import ChangePassword from "./pages/ChangePassword";
import CompleteProfile from "./pages/CompleteProfile";
import WizardEditForm from "./components/WizardEditForm";


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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserContext.Provider value={user}>
          <div className="app-container">
            <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <div className="content-wrap">
                <Routes>
                  <Route
                  path="/"
                  element={
                    isLoggedIn ? (
                      user.role === "Admin" || user.role === "Agent" ? (
                        <Workspace role={user.role} />
                      ) : (
                        <Home />
                      )
                    ) : (
                      <Home /> 
                    )
                  }
                />
              <Route path="/login" element={<Login />} />

              <Route path="/records" element={<Records />} />
              <Route path="/records/:recordId" element={<Record />} />
              <Route path="/specialOffers" element={<SpecialOffers />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />

              <Route path="/specialOfferDetails/:offerId" element={<SpecialOfferDetails />} />
              <Route path="/reserve-special-offer" element={<SpecialOfferReservation />} />


              {/* Admin and Agent Only */}
              <Route element={<ProtectedRoute requiredRoles={["Admin", "Agent"]} />}>
                <Route path="/profile-page" element={<ProfilePage />} />
                <Route path="/change-password" element={<ChangePassword />} /> 
                <Route path="/register" element={<Register />} />



                <Route path="/records/create" element={<CreateRecord />} />

                <Route path="/records/edit/:recordId" element={<EditRecord />} />

                <Route path="/admin-client-list" element={<AdminClientList />} />
                <Route path="/clients/:clientId" element={<ClientDetail />} />
                <Route path="/clients/edit/:clientId" element={<AdminEditClient />} />


                <Route path="/admin-trip-list" element={<AdminTripList />} />

                <Route path="/trips/client" element={<WizardForm />} />
                <Route path="/edit-trip/:tripId" element={<WizardEditForm />} />
                <Route path="/trips/:tripId" element={<ClientTrip />} />


                <Route path="/trips/special-offer" element={<SpecialOfferCreate />} />
                <Route path="/trips/cruise" element={<CruiseTripCreate />} />

                <Route path="/clients/create" element={<CreateClient />} />
                <Route path="/special-offers" element={<AdminSpecialOffers />} />




              </Route>
                <Route element={<ProtectedRoute requiredRoles={["Admin"]} />}>
                
                <Route path="/agents" element={<AdminAgentList />} />
                <Route path="/agents/:agentId" element={<AgentDetail />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </Navbar>
            <Footer />
          </div>
        </UserContext.Provider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
