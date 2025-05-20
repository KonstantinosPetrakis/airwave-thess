import { JSX } from "react";
import Xarrow from "react-xarrows";

import { useTheme } from "@mui/material/styles";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SchoolIcon from "@mui/icons-material/School";
import MovieIcon from "@mui/icons-material/Movie";
import CodeIcon from "@mui/icons-material/Code";
import PaletteIcon from "@mui/icons-material/Palette";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

type ProfileProps = {
  id: string;
  image: string;
  url: string;
  name: string;
  education: string;
  hobbies: string[];
  hobbiesIcons: JSX.Element[];
  about: string;
};

const profiles: ProfileProps[] = [
  {
    id: "kikicha",
    image: "/kikicha.jpg",
    name: "Kyriaki Pantsiopoulou",
    url: "https://www.linkedin.com/in/kiriaki-pantsiopoulou-a701b0215/",
    education:
      "BSc @UOM Applied Informatics; MSc @AUTH Business Administration & Information Systems",
    hobbies: ["Cinema", "Gaming", "Art"],
    hobbiesIcons: [<MovieIcon />, <SportsEsportsIcon />, <PaletteIcon />],
    about: `I hold a Bachelor's degree in Applied Informatics from the University of Macedonia 
    and a Master's degree in Business Administration & Information Systems from Aristotle University
    of Thessaloniki. I'm particularly interested in creative applications of programming and enjoy
    exploring the intersection of technology and artistic expression.`,
  },
  {
    id: "kostas",
    image: "/kostas.jpg",
    name: "Konstantinos Petrakis",
    url: "https://www.linkedin.com/in/konpetrakis/",
    education: "BSc @AUTH Computer Science",
    hobbies: ["Programming", "Gaming", "Weightlifting"],
    hobbiesIcons: [<CodeIcon />, <SportsEsportsIcon />, <FitnessCenterIcon />],
    about: `
      I am a graduate of the Computer Science Department at Aristotle University of Thessaloniki.
      My professional experience centers on web development,
      with a particular emphasis on cross-platform solutions that ensure broad 
      accessibility and performance. I have a strong interest in scientific computing, 
      especially in the areas of data analysis and visual representation.
      In my free time, I enjoy weightlifting, gaming, and developing practical, 
      fun applications that blend utility with every day needs.`,
  },
];

function Profile({
  id,
  image,
  name,
  url,
  education,
  hobbies,
  hobbiesIcons,
  about,
}: ProfileProps) {
  const theme = useTheme();

  const firstName = name.split(" ")[0];
  const lastName = name.split(" ")[1];
  const firstNameInitial = firstName.charAt(0).toUpperCase();
  const lastNameInitial = lastName.charAt(0).toUpperCase();
  const firstNameRest = firstName.slice(1).toLowerCase();
  const lastNameRest = lastName.slice(1).toLowerCase();

  const initialsStyle = {
    color: theme.palette.primary.main,
    fontWeight: "bold",
    fontSize: "1.5rem",
  };

  return (
    <Stack
      id={id}
      component="a"
      target="_blank"
      href={url}
      alignItems="flex-start"
      sx={{
        width: "100%",
        maxWidth: "400px",
        border: `3px solid ${theme.palette.primary.main}`,
        backgroundColor: (theme) => theme.palette.divider,
        p: 2,
        borderRadius: 2,
        textDecoration: "none",
        color: (theme) => theme.palette.text.primary,
      }}
    >
      <img
        src={image}
        alt={name}
        style={{
          width: "auto",
          maxWidth: "100%",
          maxHeight: "300px",
          alignSelf: "center",
          borderRadius: "10px",
        }}
      />
      <Typography variant="h6" alignSelf="center" title={name}>
        <b style={initialsStyle}> {firstNameInitial}</b>
        {firstNameRest}
        <b style={initialsStyle}> {lastNameInitial}</b>
        {lastNameRest}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <SchoolIcon />
        <Typography variant="subtitle1" sx={{ color: "text.secondary" }}>
          {education}
        </Typography>
      </Stack>

      {hobbies.map((hobby, index) => (
        <Stack key={hobby} direction="row" spacing={1} sx={{ mb: 1 }}>
          {hobbiesIcons[index]}
          <Typography variant="subtitle1" sx={{ color: "text.secondary" }}>
            {hobby}
          </Typography>
        </Stack>
      ))}

      <Divider sx={{ width: "100%", mb: 2 }} />

      <Typography variant="body1" sx={{ color: "text.secondary" }}>
        {about}
      </Typography>
    </Stack>
  );
}

export default function About(): JSX.Element {
  const theme = useTheme();

  return (
    <Stack alignItems="center" spacing="5rem" sx={{ my: 2 }}>
      <Box sx={{ visibility: { xs: "hidden", sm: "visible" } }}>
        <Xarrow
          start="team_name"
          end="kostas"
          startAnchor="bottom"
          endAnchor="top"
          color={theme.palette.primary.main}
        />
        <Xarrow
          start="team_name"
          end="kikicha"
          startAnchor="bottom"
          endAnchor="top"
          color={theme.palette.primary.main}
        />
      </Box>

      <Typography
        id="team_name"
        variant="h2"
        sx={{ color: "primary.main", width: "fit-content" }}
      >
        (KP)<sup>2</sup> Team
      </Typography>

      <Stack
        width={{ xs: "100%", sm: "80%" }}
        direction={{ xs: "column", sm: "row" }}
        justifyContent={{ xs: "center", sm: "space-evenly" }}
        alignItems={{ xs: "center", sm: "stretch" }}
        gap={2}
      >
        {profiles.map((profile) => (
          <Profile key={profile.id} {...profile} />
        ))}
      </Stack>
    </Stack>
  );
}
