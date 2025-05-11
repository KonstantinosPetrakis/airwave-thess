import { JSX } from "react";
import { Link } from "react-router";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";

export default function AppBar(): JSX.Element {
  return (
    <Stack
      direction="row"
      p={1.5}
      justifyContent="space-between"
      alignItems="center"
      bgcolor="primary.main"
    >
      <Stack direction="column" spacing={2} alignItems="center">
        <Link to="/" style={{ display: "block" }}>
          <img
            src="/logo.png"
            alt="AirWaveThess Logo"
            style={{ width: "7rem", borderRadius: "10%" }}
          />
        </Link>
        <Typography color="white">
          Presented by{" "}
          <MuiLink
            component={Link}
            to="/about"
            color="white"
            underline="none"
            fontWeight="bold"
            sx={{
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            (KP)^2
          </MuiLink>
        </Typography>
      </Stack>
      <Link to="https://openup.okfn.gr/" target="_blank">
        <img
          src="/openuplogo.svg"
          alt="OpenUp Hackathon Logo"
          style={{ width: "14rem" }}
        />
      </Link>
    </Stack>
  );
}
