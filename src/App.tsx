"use client"

import { useEffect, useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import "./App.css"
import Login from "./pages/Login"
import Home from "./pages/Home"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import axios from "axios"
import { API_URL } from "./Utils/Configuration"
import UserContext from "./contexts/UserContext"
import ProtectedRoute from "./components/ProtectedRoute"
import { CssBaseline } from "@mui/material"
import SpecialOffers from "./pages/SpecialOffers"
import SpecialOfferDetails from "./pages/SpecialOfferDetails"
import { ThemeProvider } from "@mui/material/styles"
import theme from "./Theme"
import AdminClientList from "./pages/AdminClientList"
import AdminTripList from "./pages/AdminTripList"
import ClientTrip from "./pages/ClientTrip"
import ProfilePage from "./pages/ProfilePage"
import Workspace from "./pages/Workspace"

import WizardForm from "./pages/CreateTripWizardPage"
import ClientDetail from "./pages/ClientDetail"
import SpecialOfferReservation from "./pages/SpecialOfferReservation"

import AdminAgentList from "./pages/AdminAgentList"
import AgentDetail from "./pages/AgentDetails"
import WizardEditFormPage from "./pages/EditTripWizardPage"
import ClientSpecialOfferCreation from "./pages/CreateClientOfferWizardPage"
import ClientSpecialOffer from "./pages/ClientSpecialOffer"
import { NavigationProvider } from "./contexts/NavigationContext"
import EditClientOfferWizardPage from "./pages/EditClientOfferWizardPage"
import PublicOfferCreationForm from "./pages/CreatePublicOfferWizardPage"
import AdminClientSpecialOffers from "./pages/AdminClientSpecialOffers"
import AdminPublicSpecialOffers from "./pages/AdminPublicSpecialOffers"
import PartnerList from "./pages/PartnerList"
import PartnerDetails from "./pages/PartnerDetails"
import AdminPublicSpecialOfferDetails from "./pages/AdminPublicSpecialOfferDetails"
import TwoFactorAuth from "./pages/TwoFactorAuth"
import TwoFactorSetup from "./pages/TwoFactorSetup"
import AgentOnboarding from "./pages/AgentOnboarding"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import EditPublicOfferWizardPage from "./pages/EditPublicOfferWizardPage"
import AdminPublicSpecialOfferReservations from "./pages/AdminPublicSpecialOfferReservations"
import CompanyDetail from "./pages/CompanyDetail"
import AdminBlogList from "./pages/AdminBlogList"
import BlogDetail from "./pages/BlogDetail"
//  Added new blog-related imports
import BlogList from "./pages/BlogList"
import BlogEditor from "./pages/BlogEditor"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState({ id: "", email: "", role: null })

  useEffect(() => {
    const checkLoginStatus = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get(`${API_URL}/Auth/getUser`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })

        if (response.status === 200) {
          setIsLoggedIn(true)
          setUser(response.data)
        }
      } catch (error) {
        console.error("Error checking login status", error)
        setIsLoggedIn(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkLoginStatus()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    setIsLoggedIn(false)
    setUser({ id: "", email: "", role: null })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserContext.Provider value={user}>
          <NavigationProvider>
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
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    <Route path="/specialOffers" element={<SpecialOffers />} />
                    <Route path="/specialOfferDetails/:id" element={<SpecialOfferDetails />} />
                    <Route path="/reserve-special-offer/:id" element={<SpecialOfferReservation />} />

                    {/*  Added public blog routes */}
                    <Route path="/blogs" element={<BlogList />} />
                    <Route path="/blog/:slug" element={<BlogDetail />} />

                    <Route path="/2fa-setup" element={<TwoFactorSetup />} />

                    <Route element={<ProtectedRoute requiredRoles={["Admin", "Agent"]} />}>
                      <Route path="/profile-page" element={<ProfilePage />} />
                      <Route path="/admin-client-list" element={<AdminClientList />} />
                      <Route path="/admin-client-list/client/:clientId" element={<ClientDetail />} />
                      <Route path="/admin-client-list/company/:companyId" element={<CompanyDetail />} />
                      <Route path="/admin-trip-list" element={<AdminTripList />} />
                      <Route path="/admin-trip-list/:tripId" element={<ClientTrip />} />
                      <Route path="/admin-trip-list/:tripId/edit" element={<WizardEditFormPage />} />
                      <Route path="/admin-trip-list/create" element={<WizardForm />} />
                      <Route path="/partner-list" element={<PartnerList />} />
                      <Route path="/partner-list/:partnerId" element={<PartnerDetails />} />
                      <Route path="/special-offers" element={<AdminClientSpecialOffers />} />
                      <Route path="/public-offers" element={<AdminPublicSpecialOffers />} />
                      <Route path="/special-offers/create" element={<ClientSpecialOfferCreation />} />
                      <Route path="/special-offers/:tripId" element={<ClientSpecialOffer />} />
                      <Route path="/special-offers/:tripId/edit" element={<EditClientOfferWizardPage />} />
                      
                      <Route path="/public-offers/create" element={<PublicOfferCreationForm />} />
                      <Route path="/public-offers/:id" element={<AdminPublicSpecialOfferDetails />} />
                      <Route
                        path="/public-offers/:offerId/reservations"
                        element={<AdminPublicSpecialOfferReservations />}
                      />
                      <Route path="/public-offers/:tripId/edit" element={<EditPublicOfferWizardPage />} />
                      <Route path="/2fa-verify" element={<TwoFactorAuth />} />
                      <Route path="/agent-onboarding" element={<AgentOnboarding />} />

                      {/*  Added admin blog routes */}
                      <Route path="/admin-blog-list" element={<AdminBlogList />} />
                      <Route path="/admin-blog-list/blog/:blogId" element={<BlogDetail />} />
                      <Route path="/admin-blog-list/create" element={<BlogEditor />} />
                      <Route path="/admin-blog-list/blog/:blogId/edit" element={<BlogEditor />} />
                      
                    </Route>

                    <Route element={<ProtectedRoute requiredRoles={["Admin"]} />}>
                      <Route path="/agents" element={<AdminAgentList />} />
                      <Route path="/agents/:id" element={<AgentDetail />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </Navbar>
              <Footer />
            </div>
          </NavigationProvider>
        </UserContext.Provider>
      </ThemeProvider>
    </Router>
  )
}

export default App
