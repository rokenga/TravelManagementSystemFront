import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ApartmentIcon from "@mui/icons-material/Apartment";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import Logo from "./Logo";

interface NavbarProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ children, isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  const navigateTo = (path: string) => {
    navigate(path);
  };

  const toggleDrawer =
    (open: boolean) =>
    (
      event: React.KeyboardEvent | React.MouseEvent
    ): void => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setDrawerOpen(open);
    };

  const menuItems = [
    {
      text: "Į pradžią",
      onClick: () => navigateTo("/"),
      path: "/",
      icon: <HomeIcon />,
    },
    {
      text: "Kryptys",
      onClick: () => navigateTo("/destinations"),
      path: "/destinations",
      icon: <ApartmentIcon />,
    },
    ...(isLoggedIn
      ? [
          {
            text: "Atsijungti",
            onClick: handleLogout,
            path: "/logout",
            icon: <LogoutIcon />,
          },
        ]
      : [
          {
            text: "Prisijungti",
            onClick: () => navigateTo("/login"),
            path: "/login",
            icon: <LoginIcon />,
          },
          {
            text: "Registruotis",
            onClick: () => navigateTo("/register"),
            path: "/register",
            icon: <AppRegistrationIcon />,
          },
        ]),
  ];

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItem button onClick={item.onClick}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" style={{ width: "100%", left: 0, top: 0, backgroundColor: "#e0f5ff" }}>
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
          {/* Logo */}
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

          {/* Desktop Menu */}
          {!isMobile && (
            <Stack direction="row" spacing={2}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  sx={{
                    color: "#004784",
                    borderBottom: location.pathname === item.path ? "2px solid #004784" : "none",
                  }}
                  onClick={item.onClick}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
              ))}
            </Stack>
          )}

          {/* Mobile Menu Icon */}
          {isMobile && (
            <>
              <IconButton
                color="inherit"
                edge="end"
                onClick={toggleDrawer(true)}
                aria-label="open navigation menu"
              >
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
  );
};

export default Navbar;
