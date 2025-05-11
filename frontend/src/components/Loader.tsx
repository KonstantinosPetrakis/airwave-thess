import { JSX } from "react";

import CircularProgress from "@mui/material/CircularProgress";

export default function Loader(): JSX.Element {
  return (
    <CircularProgress
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}
