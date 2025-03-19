"use client"

import type React from "react"
import { useState, useContext } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  AppBar,
  Toolbar,
  Button,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import HomeIcon from "@mui/icons-material/Home"
import ApartmentIcon from "@mui/icons-material/Airlines"
import LogoutIcon from "@mui/icons-material/Logout"
import PlaneIcon from "@mui/icons-material/Hotel"
import ShipIcon from "@mui/icons-material/Water"
import ProfileIcon from "@mui/icons-material/Person"
import StarIcon from "@mui/icons-material/Star"
import ArticleIcon from "@mui/icons-material/Article"
import AgentsIcon from "@mui/icons-material/Group"

import { UserContext } from "../contexts/UserContext"
import Logo from "./Logo"

interface NavbarProps {
  children: React.ReactNode
  onLogout: () => void
}

const Navbar: React.FC<NavbarProps> = ({ children, onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useContext(UserContext)
  const role = user?.role

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = () => {
    onLogout()
    navigate("/login")
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const navigateTo = (path: string) => {
    navigate(path)
  }

  const toggleDrawer =
    (open: boolean) =>
    (event: React.KeyboardEvent | React.MouseEvent): void => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" || (event as React.KeyboardEvent).key === "Shift")
      ) {
        return
      }
      setDrawerOpen(open)
    }

  const roleBasedMenu = {
    Guest: [
      { text: "Į pradžią", path: "/", icon: <HomeIcon /> },
      { text: "Karšti kelionių pasiūlymai", path: "/specialOffers", icon: <StarIcon /> },
      { text: "Karšti kruizų pasiūlymai", path: "/specialOffers", icon: <ShipIcon /> },
      { text: "Tinklaraštis", path: "/records", icon: <ArticleIcon /> },
    ],
    Client: [
      { text: "Į pradžią", path: "/", icon: <HomeIcon /> },
      { text: "Kryptys", path: "/destinations", icon: <ApartmentIcon /> },
      { text: "Karšti pasiūlymai", path: "/specialOffers", icon: <StarIcon /> },
    ],
    Admin: [
      { text: "Į pradžią", path: "/", icon: <HomeIcon /> },
      { text: "Agentai", path: "/agents", icon: <AgentsIcon /> },
      { text: "Klientai", path: "/admin-client-list", icon: <ProfileIcon /> },
      { text: "Kelionės", path: "/admin-trip-list", icon: <PlaneIcon /> },
      { text: "Spec. pasiūlymai", path: "/special-offers", icon: <StarIcon /> },
      { text: "Tinklaraštis", path: "/records", icon: <ArticleIcon /> },
    ],
    Agent: [
      { text: "Į pradžią", path: "/", icon: <HomeIcon /> },
      { text: "Klientai", path: "/admin-client-list", icon: <ProfileIcon /> },
      { text: "Kelionės", path: "/admin-trip-list", icon: <PlaneIcon /> },
      { text: "Spec. pasiūlymai", path: "/special-offers", icon: <StarIcon /> },
      { text: "Tinklaraštis", path: "/records", icon: <ArticleIcon /> },
    ],
  }

  const menuItems = roleBasedMenu[role || "Guest"]

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItem button onClick={() => navigateTo(item.path)} data-path={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          </ListItem>
        ))}
        {role && (
          <>
            <ListItem button onClick={() => navigateTo("/profile-page")} data-path="/profile-page">
              <ListItemIcon>
                <ProfileIcon />
              </ListItemIcon>
              <ListItemText primary="Paskyra" />
            </ListItem>
            <ListItem button onClick={handleLogout} data-path="/login">
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Atsijungti" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  return (
    <>
      <AppBar
        position="fixed"
        style={{
          width: "100%",
          left: 0,
          top: 0,
          backgroundColor: "#e0f5ff",
        }}
      >
        <Toolbar
          style={{
            margin: "0 auto",
            width: "100%",
            minHeight: "80px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              height: "50px",
              width: "auto",
              display: "flex",
              alignItems: "center",
              padding: "10px",
            }}
          >
            <Logo />
          </div>

          {!isMobile && (
            <Stack direction="row" spacing={2}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  sx={{
                    color: "#004784",
                    borderBottom: location.pathname === item.path ? "2px solid #004784" : "none",
                    textTransform: "none",
                    fontSize: "14px",
                    "&:hover": {
                      backgroundColor: "rgba(0, 71, 132, 0.04)",
                    },
                  }}
                  onClick={() => navigateTo(item.path)}
                  startIcon={item.icon}
                  data-path={item.path} // Add data-path attribute
                >
                  {item.text}
                </Button>
              ))}
              {role && (
                <>
                  <Button
                    onClick={handleMenuOpen}
                    startIcon={<ProfileIcon />}
                    sx={{
                      color: "#004784",
                      textTransform: "none",
                      fontSize: "14px",
                      "&:hover": {
                        backgroundColor: "rgba(0, 71, 132, 0.04)",
                      },
                    }}
                  >
                    Paskyra
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                      elevation: 2,
                      sx: {
                        mt: 1.5,
                        minWidth: "150px",
                        borderRadius: "8px",
                        "& .MuiMenuItem-root": {
                          fontSize: "14px",
                          color: "#004784",
                          padding: "8px 16px",
                          "&:hover": {
                            backgroundColor: "rgba(0, 71, 132, 0.04)",
                          },
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  >
                    <MenuItem
                      onClick={() => {
                        navigateTo("/profile-page")
                        handleMenuClose()
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                      data-path="/profile-page" // Add data-path attribute
                    >
                      <ProfileIcon sx={{ fontSize: 20 }} />
                      Peržiūrėti paskyrą
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleLogout()
                        handleMenuClose()
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                      data-path="/login" // Add data-path attribute
                    >
                      <LogoutIcon sx={{ fontSize: 20 }} />
                      Atsijungti
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Stack>
          )}

          {isMobile && (
            <>
              <IconButton color="inherit" edge="end" onClick={toggleDrawer(true)} aria-label="open navigation menu">
                <MenuIcon />
              </IconButton>
              <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
                {drawer}
              </Drawer>
            </>
          )}
        </Toolbar>
      </AppBar>
      <main style={{ marginTop: "64px" }}>{children}</main>
    </>
  )
}

export default Navbar