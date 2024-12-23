import * as React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { API_URL } from "../Utils/Configuration";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const defaultTheme = createTheme();

export default function SignUp() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    //repeatPassword: "",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validate = (data: any) => {
    const tempErrors = { ...errors };
    tempErrors.email = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(
      data.get("email") as string
    )
      ? ""
      : "Neteisingas el. pašto adreso formatas";
    tempErrors.password =
      data.get("password").length > 5
        ? ""
        : "Slaptažodį turi sudaryti mažiausiai 6 simboliai";
    /*tempErrors.repeatPassword =
      data.get("password") === data.get("repeatPassword")
        ? ""
        : "Neteisingai pakartotas slaptažodis";*/
    setErrors(tempErrors);
    return Object.values(tempErrors).every((x) => x === "");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    if (!validate(data)) {
      console.error("Validation errors:", errors);
      return;
    }

    const postData = {
      email: data.get("email"),
      password: data.get("password"),
    };

    try {
      const response = await axios.post(
        API_URL + "/Auth/register",
        postData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Success:", response.data);
      navigate("/login");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Response was not ok.", error.response?.data);
        setErrors({ ...errors, email: error.response?.data.Message });
      } else {
        console.error("Error during Axios request:", error);
      }
      
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h5">
            Registruokis
          </Typography>
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="El. paštas"
                  name="email"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Slaptažodis"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password}
                />
              </Grid>
              {/*<Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="repeatPassword"
                  label="Patvirtinti slaptažodį"
                  type="password"
                  id="repeatPassword"
                  error={!!errors.repeatPassword}
                  helperText={errors.repeatPassword}
                />
              </Grid>*/}
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Registruotis
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="/login" variant="body2">
                  Jau turite paskyrą? Prisijunk!
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}