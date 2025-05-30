import CssBaseline from "@mui/material/CssBaseline";
import "leaflet/dist/leaflet.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "katex/dist/katex.min.css";

import { JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Container from "@mui/material/Container";

import AppBar from "./components/AppBar";
import Chat from "./components/Chat";
import Home from "./views/Home";
import Quality from "./views/Quality";
import About from "./views/About";

const theme = createTheme({
  palette: {
    primary: {
      main: "#109ea2",
    },
    secondary: {
      main: "#0d7377",
    },
  },
});

function App(): JSX.Element {
  return (
    <>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <BrowserRouter>
            <AppBar />
            <Container maxWidth="xl">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/quality" element={<Quality />} />
              </Routes>
            </Container>
            <Chat />
          </BrowserRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
