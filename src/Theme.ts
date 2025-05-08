import { createTheme } from "@mui/material/styles";

// Extend MUI's PaletteColorOptions to include 'lighter'
declare module "@mui/material/styles" {
  interface PaletteColor {
    lighter?: string;
  }
  interface SimplePaletteColorOptions {
    lighter?: string;
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#004785",
    },
    secondary: {
      main: "#F58220",
    },
    background: {
      default: "#f5f7fa",
    },
    error: {
      main: "#d32f2f",
      light: "#ef5350",
      dark: "#c62828",
      contrastText: "#fff",
      lighter: "rgba(211, 47, 47, 0.08)",
    },
    info: {
      main: "#0288d1",
      light: "#03a9f4",
      dark: "#01579b",
      contrastText: "#fff",
      lighter: "rgba(2, 136, 209, 0.08)",
    },
  },
  typography: {
    fontFamily: "'Playfair Display', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--mui-palette-error-lighter": "rgba(211, 47, 47, 0.08)",
          "--mui-palette-info-lighter": "rgba(2, 136, 209, 0.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
        },
      },
    },
  },
});

export default theme;
