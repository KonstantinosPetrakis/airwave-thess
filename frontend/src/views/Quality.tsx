import { JSX, useEffect, useRef } from "react";
import katex from "katex";

import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";

export function LatexComponent({ formula }: { formula: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    katex.render(formula, containerRef.current, {
      throwOnError: false,
    });
  }, [formula]);

  return <span ref={containerRef} />;
}

function ColorBox({ color, text }: { text: string; color: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          display: "inline-block",
          width: 20,
          height: 20,
          backgroundColor: color,
        }}
      />
      <Typography variant="body2">{text}</Typography>
    </Stack>
  );
}

function DataSources(): JSX.Element {
  const logoStyle = {
    width: "100%",
    maxWidth: 150,
    height: "auto",
    objectFit: "contain",
    display: "block",
  };

  return (
    <Box>
      <Typography variant="h4"> Data Sources </Typography>

      <Typography gutterBottom>
        All the data is collected from Thessaloniki Data Space, and more
        specifically from Thessaloniki Port Authority and Open Knowledge Greece.
      </Typography>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ mx: 2 }}
      >
        <Link href="https://tds.okfn.gr/" target="_blank">
          <Box component="img" src="/tds.svg" alt="tds logo" sx={logoStyle} />
        </Link>
        <Link href="https://www.thpa.gr/" target="_blank">
          <Box component="img" src="/thpa.svg" alt="thpa logo" sx={logoStyle} />
        </Link>
        <Link href="https://okfn.gr/" target="_blank">
          <Box component="img" src="/opk.svg" alt="opk logo" sx={logoStyle} />
        </Link>
      </Stack>
    </Box>
  );
}

function AirPollutantTable({
  data,
}: {
  data: { range: string; index: number }[];
}) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Index</TableCell>
          <TableCell>
            Concentration (
            <LatexComponent formula="\mu\mathrm{g}/\mathrm{m}^3" />)
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={idx}>
            <TableCell>{row.index}</TableCell>
            <TableCell>{row.range}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AirQualityIndexLevels(): JSX.Element {
  const levels = [
    {
      index: 1,
      level: "Good",
      color: "#0033a0",
      text: "Dark Blue",
      health: "Air quality is considered satisfactory.",
    },
    {
      index: 2,
      level: "Fair",
      color: "#4fc3f7",
      text: "Light Blue",
      health: "Acceptable, but possible concern for sensitive individuals.",
    },
    {
      index: 3,
      level: "Moderate",
      color: "#388e3c",
      text: "Green",
      health: "Some pollutants may cause a risk to health.",
    },
    {
      index: 4,
      level: "Poor",
      color: "#fbc02d",
      text: "Yellow",
      health: "Health effects may be experienced.",
    },
    {
      index: 5,
      level: "Very Poor",
      color: "#ff9800",
      text: "Orange",
      health: "Increased risk for everyone.",
    },
    {
      index: 6,
      level: "Extremely Poor",
      color: "#d32f2f",
      text: "Red",
      health: "Serious health effects likely.",
    },
  ];

  return (
    <>
      <Typography>
        AQI defines six different levels of air quality, each represented by a
        different color.
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Index</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Health Implications</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {levels.map((row) => (
              <TableRow key={row.index}>
                <TableCell>{row.index}</TableCell>
                <TableCell>{row.level}</TableCell>
                <TableCell>
                  <ColorBox color={row.color} text={row.text} />
                </TableCell>
                <TableCell>{row.health}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function AirPollutantInfo() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Pollutant Details and Health Effects
      </Typography>

      <Stack spacing={4}>
        <Box>
          <Typography variant="h6">
            Ozone (<LatexComponent formula="\mathrm{O_3}" />)
          </Typography>
          <Typography gutterBottom>
            Ground-level ozone is a photochemical pollutant formed by reactions
            between VOCs and NOₓ under sunlight. It can cause breathing
            difficulties, trigger asthma, reduce lung function, and lead to
            chronic lung disease.
          </Typography>
          <AirPollutantTable
            data={[
              { range: "0–50", index: 1 },
              { range: "50–100", index: 2 },
              { range: "100–130", index: 3 },
              { range: "130–240", index: 4 },
              { range: "240–380", index: 5 },
              { range: "380–800", index: 6 },
            ]}
          />
        </Box>

        <Box>
          <Typography variant="h6">
            Nitrogen Dioxide (<LatexComponent formula="\mathrm{NO_2}" />)
          </Typography>
          <Typography gutterBottom>
            NO₂ is a red-brown gas produced from traffic and combustion. It is a
            strong oxidant that irritates airways and worsens respiratory
            conditions such as asthma.
          </Typography>
          <AirPollutantTable
            data={[
              { range: "0–40", index: 1 },
              { range: "40–90", index: 2 },
              { range: "90–120", index: 3 },
              { range: "120–210", index: 4 },
              { range: "210–400", index: 5 },
              { range: "400–600", index: 6 },
            ]}
          />
        </Box>

        <Box>
          <Typography variant="h6">
            Sulphur Dioxide (<LatexComponent formula="\mathrm{SO_2}" />)
          </Typography>
          <Typography gutterBottom>
            SO₂ results from burning coal and oil. It dissolves in airways,
            causing bronchoconstriction, asthma attacks, and increased hospital
            visits due to respiratory issues.
          </Typography>
          <AirPollutantTable
            data={[
              { range: "0–100", index: 1 },
              { range: "100–200", index: 2 },
              { range: "200–350", index: 3 },
              { range: "350–500", index: 4 },
              { range: "500–750", index: 5 },
              { range: "750–1000", index: 6 },
            ]}
          />
        </Box>

        <Box>
          <Typography variant="h6">
            Carbon Monoxide (<LatexComponent formula="\mathrm{CO}" />)
          </Typography>
          <Typography gutterBottom>
            CO is an odorless gas from incomplete combustion (vehicles,
            heating). It reduces oxygen delivery by forming carboxyhemoglobin,
            leading to symptoms like headaches, dizziness, and fatigue. High
            levels can be fatal.
          </Typography>
          <AirPollutantTable
            data={[
              { range: "0–4400", index: 1 },
              { range: "4400-9400", index: 2 },
            ]}
          />
        </Box>
      </Stack>
    </Box>
  );
}

function AirQualityIndexCalculation(): JSX.Element {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        AQI Calculation
      </Typography>
      <Typography gutterBottom>
        The AQI sub-index for each pollutant is calculated using linear
        interpolation between breakpoints. This allows for a more precise value,
        even when the pollutant concentration does not exactly match a
        threshold.
      </Typography>
      <Typography gutterBottom>The formula used is:</Typography>
      <Box sx={{ my: 2 }}>
        <LatexComponent
          formula={
            "I_p = I_{lo} + \\frac{(I_{hi} - I_{lo}) \\times (C_p - C_{lo})}{C_{hi} - C_{lo}}"
          }
        />
      </Box>
      <Typography variant="body2" gutterBottom>
        Where:
      </Typography>
      <ul>
        <li>
          <b>
            <LatexComponent formula="I_p" />
          </b>
          : Calculated sub-index for the pollutant
        </li>
        <li>
          <b>
            <LatexComponent formula="C_p" />
          </b>
          : Measured pollutant concentration
        </li>
        <li>
          <b>
            <LatexComponent formula="C_{lo},\ C_{hi}" />
          </b>
          : Breakpoints that enclose <LatexComponent formula="C_p" />
        </li>
        <li>
          <b>
            <LatexComponent formula="I_{lo},\ I_{hi}" />
          </b>
          : Index levels corresponding to <LatexComponent formula="C_{lo}" />{" "}
          and <LatexComponent formula="C_{hi}" />
        </li>
      </ul>
      <Typography gutterBottom>
        The final AQI for a location and time is determined by the highest
        sub-index among all pollutants:
      </Typography>
      <Box sx={{ my: 2 }}>
        <LatexComponent
          formula={
            "\\mathrm{AQI} = \\max(I_{NO_2}, I_{SO_2}, I_{O_3}, I_{CO}, ...)"
          }
        />
      </Box>
      <Typography>
        This approach ensures that the AQI reflects the worst air quality
        condition present.
      </Typography>
    </Box>
  );
}

function AirQualityIndex(): JSX.Element {
  return (
    <Box>
      <Typography variant="h4"> Air Quality Index </Typography>
      <Typography>
        The Air Quality Index (AQI) used in our applications is heavily based on
        the European Air Quality Index (EAQI). From now on, we will refer to Air
        Quality Index used in our application as AQI.
      </Typography>

      <Typography>
        The final AQI value for a location is determined by the worst sub-index
        among the pollutants measured at a given time. This is known as the
        maximum operator rule.
      </Typography>

      <AirQualityIndexLevels />
      <AirPollutantInfo />
      <AirQualityIndexCalculation />
    </Box>
  );
}

function SeaWaterQualityIndexLevels(): JSX.Element {
  const wqiLevels = [
    { range: "90–100", quality: "Excellent" },
    { range: "70–90", quality: "Good" },
    { range: "50–70", quality: "Medium" },
    { range: "25–50", quality: "Bad" },
    { range: "<25", quality: "Very Bad" },
  ];

  return (
    <>
      <Typography>
        While the WQI is a continuous scale from 0 to 100, it is divided into
        five categories:
      </Typography>
      <TableContainer sx={{ maxWidth: 400, my: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>WQI Range</TableCell>
              <TableCell>Quality</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wqiLevels.map((level) => (
              <TableRow key={level.quality}>
                <TableCell>{level.range}</TableCell>
                <TableCell>{level.quality}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function SeaWaterQualityParameterInfo(): JSX.Element {
  const parameters = [
    {
      name: "Arsenic (As)",
      definition:
        "A toxic metalloid present from industrial discharges or natural sources.",
      weight: 0.15,
      guideline: "0.012 mg/L (12 µg/L)",
    },
    {
      name: "Cadmium (Cd)",
      definition:
        "A heavy metal associated with battery and coating industries.",
      weight: 0.15,
      guideline: "0.0055 mg/L (5.5 µg/L)",
    },
    {
      name: "Copper (Cu)",
      definition:
        "An essential trace element, toxic at elevated concentrations.",
      weight: 0.1,
      guideline: "0.0013 mg/L (1.3 µg/L)",
    },
    {
      name: "Dissolved Oxygen (%)",
      definition:
        "Percentage of oxygen saturation in water, crucial for marine life.",
      weight: 0.25,
      guideline: "100% (saturation)",
    },
    {
      name: "Lead (Pb)",
      definition:
        "A toxic heavy metal with neurological and developmental effects.",
      weight: 0.1,
      guideline: "0.0044 mg/L (4.4 µg/L)",
    },
    {
      name: "Nickel (Ni)",
      definition:
        "Present in industrial effluents, toxic to aquatic organisms.",
      weight: 0.1,
      guideline: "0.07 mg/L (70 µg/L)",
    },
    {
      name: "Temperature (°C)",
      definition:
        "Affects oxygen solubility and metabolic rates; used to interpret DO levels.",
      weight: 0.15,
      guideline: "Optimal 20°C",
    },
  ];

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Parameters and Weights
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Parameter</TableCell>
              <TableCell>Definition</TableCell>
              <TableCell>
                Weight (<LatexComponent formula="W_i" />)
              </TableCell>
              <TableCell>
                Guideline (<LatexComponent formula="T_i" />)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parameters.map((param) => (
              <TableRow key={param.name}>
                <TableCell>{param.name}</TableCell>
                <TableCell>{param.definition}</TableCell>
                <TableCell>{param.weight}</TableCell>
                <TableCell>{param.guideline}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function SeaWaterQualityIndexComputation(): JSX.Element {
  return (
    <>
      <Typography variant="h5" gutterBottom>
        WQI Calculation
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Sub-Index Calculation
      </Typography>
      <Typography gutterBottom>
        The sub-index for each parameter is calculated as follows:
      </Typography>
      <ul>
        <li>
          <b>Chemical pollutants:</b>{" "}
          <LatexComponent
            formula={
              "Q_i = \\max\\left(0,\\ 100 \\times \\left(1 - \\frac{C_i}{T_i}\\right)\\right)"
            }
          />
        </li>
        <li>
          <b>Temperature (°C):</b>{" "}
          <LatexComponent
            formula={
              "Q = \\max\\left(0,\\ 100 \\times \\left(1 - \\frac{|T - 20|}{10}\\right)\\right)"
            }
          />
        </li>
        <li>
          <b>Dissolved Oxygen (%):</b>{" "}
          <LatexComponent formula={"Q = \\min(\\mathrm{DO\\%},\\ 100)"} />
        </li>
      </ul>
      <Typography variant="body2" gutterBottom>
        Where:
      </Typography>
      <ul>
        <li>
          <b>
            <LatexComponent formula="Q_i" />
          </b>
          : Sub-index for parameter i (0–100)
        </li>
        <li>
          <b>
            <LatexComponent formula="C_i" />
          </b>
          : Measured concentration (mg/L)
        </li>
        <li>
          <b>
            <LatexComponent formula="T_i" />
          </b>
          : Guideline threshold for parameter i
        </li>
      </ul>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Overall WQI Formula
      </Typography>
      <Typography gutterBottom>
        The final WQI is a weighted sum of the sub-indices:
      </Typography>
      <LatexComponent
        formula={
          "WQI = 0.25\\,Q_{DO} + 0.15\\,Q_{As} + 0.15\\,Q_{Cd} + 0.15\\,Q_{Temp} + 0.10\\,Q_{Cu} + 0.10\\,Q_{Pb} + 0.10\\,Q_{Ni}"
        }
      />
    </>
  );
}

function SeaWaterQualityIndex(): JSX.Element {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Sea Water Quality Index (WQI)
      </Typography>
      <Typography gutterBottom>
        The Water Quality Index (WQI) used in this application is based on a
        weighted sum of sub-indices for each parameter. While this approach aims
        to provide a useful overview of water quality, it may not capture every
        nuance or local variation.
      </Typography>

      <SeaWaterQualityIndexLevels />
      <SeaWaterQualityParameterInfo />
      <SeaWaterQualityIndexComputation />
    </Box>
  );
}

function Sources(): JSX.Element {
  return (
    <Box sx={{ textWrap: "break-word", "& *": { wordBreak: "break-word" } }}>
      <Typography variant="h4"> Sources </Typography>
      <ol>
        <li>
          European Environment Agency. "European Air Quality Index Methodology."
          <Link
            href="https://www.eea.europa.eu/themes/air/air-quality-index"
            target="_blank"
          >
            https://www.eea.europa.eu/themes/air/air-quality-index
          </Link>
        </li>
        <li>
          European Commission. "Directive 2008/50/EC on ambient air quality and
          cleaner air for Europe."
          <Link
            href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32008L0050"
            target="_blank"
          >
            https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32008L0050
          </Link>
        </li>
        <li>
          World Health Organization. "Air quality guidelines for Europe." 2nd
          edition.
          <Link
            href="https://www.euro.who.int/__data/assets/pdf_file/0005/74732/E71922.pdf"
            target="_blank"
          >
            https://www.euro.who.int/__data/assets/pdf_file/0005/74732/E71922.pdf
          </Link>
        </li>
        <li>
          Technical Assistance Document for the Reporting of Daily Air Quality –
          the Air Quality Index (AQI)
          <Link
            href="https://www.airnow.gov/publications/air-quality-index/technical-assistance-document-for-reporting-the-daily-aqi/"
            target="_blank"
          >
            https://www.airnow.gov/publications/air-quality-index/technical-assistance-document-for-reporting-the-daily-aqi/
          </Link>
        </li>
        <li>
          Călmuc, V., Călmuc, M., Țopa, M., Timofti, M., Iticescu, C. and
          Georgescu, L. (2018) “Various methods for calculating the water
          quality index”, Analele Universității ”Dunărea de Jos” din Galați.
          Fascicula II, Matematică, fizică, mecanică teoretică / Annals of the
          ”Dunarea de Jos” University of Galati. Fascicle II, Mathematics,
          Physics, Theoretical Mechanics, 41(2), pp. 171-178.
        </li>
        <li>
          De La Mora-Orozco C, Flores-Lopez H, Rubio-Arias H, Chavez-Duran A,
          Ochoa-Rivero J. Developing a Water Quality Index (WQI) for an
          Irrigation Dam. Int J Environ Res Public Health. 2017 Apr
          29;14(5):439.
        </li>
        <li>
          Comparative analysis of water quality index based on seasonal
          differences in the upstream Citarum watershed, Mariana Marselina;
          Shefira Herlindya Putri; Siti Ai Nurhayati
        </li>
        <li>
          Chidiac S, El Najjar P, Ouaini N, El Rayess Y, El Azzi D. A
          comprehensive review of water quality indices (WQIs): history, models,
          attempts and perspectives. Rev Environ Sci Biotechnol.
          2023;22(2):349-395. doi: 10.1007/s11157-023-09650-7. Epub 2023 Mar 11.
          PMID: 37234131; PMCID: PMC10006569.
        </li>
        <li>
          Guidelines for drinking-water quality: Fourth edition incorporating
          the first and second addenda [Internet]. Geneva: World Health
          Organization; 2022. [Table, Nickel].
        </li>
        <li>
          <Link
            href="https://www.caryinstitute.org/news-insights/2-minute-science/dissolved-oxygen"
            target="_blank"
          >
            https://www.caryinstitute.org/news-insights/2-minute-science/dissolved-oxygen
          </Link>
        </li>
        <li>
          WHO Housing and Health Guidelines. Geneva: World Health Organization;
          2018. Table 8.2, WHO guideline values for drinking-water quality:
          chemical contaminants II. Available from:{" "}
          <Link
            href="https://www.ncbi.nlm.nih.gov/books/NBK535301/table/ch8.tab2"
            target="_blank"
          >
            https://www.ncbi.nlm.nih.gov/books/NBK535301/table/ch8.tab2
          </Link>
        </li>
        <li>
          <Link
            href="https://oap.ospar.org/en/ospar-assessments/intermediate-assessment-2017/pressures-human-activities/eutrophication/dissolved-oxygen/"
            target="_blank"
          >
            https://oap.ospar.org/en/ospar-assessments/intermediate-assessment-2017/pressures-human-activities/eutrophication/dissolved-oxygen/
          </Link>
        </li>
        <li>
          Chidiac S, El Najjar P, Ouaini N, El Rayess Y, El Azzi D. A
          comprehensive review of water quality indices (WQIs): history, models,
          attempts and perspectives. Rev Environ Sci Biotechnol.
          2023;22(2):349-395. doi: 10.1007/s11157-023-09650-7. Epub 2023 Mar 11.
          PMID: 37234131; PMCID: PMC10006569.
        </li>
        <li>
          VARIOUS METHODS FOR CALCULATING THE WATER QUALITY INDEX,
          Valentina-Andreea Călmuc, Mădălina Călmuc, Maria Cătălina Ţopa,
          Mihaela Timofti, Cătălina Iticescu, Lucian P. Georgescu
        </li>
        <li>
          Toxicity of arsenic(V) to temperate and tropical marine biota and the
          derivation of chronic marine water quality guideline values, Lisa A.
          Golding, Maria V. Valdivia, Joost W. van Dam, Graeme E. Batley, Simon
          C. Apte
        </li>
        <li>
          <Link
            href="https://www.waterquality.gov.au/anz-guidelines/guideline-values/default/water-quality-toxicants/toxicants/cadmium-2000#:~:text=A%20high%20reliability%20marine%20guideline,above%20the%20geometric%20mean%20of"
            target="_blank"
          >
            https://www.waterquality.gov.au/anz-guidelines/guideline-values/default/water-quality-toxicants/toxicants/cadmium-2000
          </Link>
        </li>
        <li>
          <Link
            href="https://www.waterquality.gov.au/anz-guidelines/guideline-values/default/water-quality-toxicants/toxicants/lead-2000#:~:text=A%20marine%20high%20reliability%20trigger,protection"
            target="_blank"
          >
            https://www.waterquality.gov.au/anz-guidelines/guideline-values/default/water-quality-toxicants/toxicants/lead-2000
          </Link>
        </li>
      </ol>
    </Box>
  );
}

function Disclaimer(): JSX.Element {
  return (
    <Box>
      <Typography variant="h4"> Disclaimer </Typography>
      <Typography>
        We are not environmental experts, and while we strive to provide
        accurate and up-to-date information, the air and water quality indexes
        presented here may not be perfect or fully comprehensive. If you notice
        any inaccuracies or have suggestions for improvement, we would greatly
        appreciate your feedback. Please feel free to contact us at{" "}
        <Link href="mailto:konstpetrakis01@gmail.com">
          konstpetrakis01@gmail.com
        </Link>{" "}
        or{" "}
        <Link href="mailto:kikipantsiopoulou@gmail.com">
          kikipantsiopoulou@gmail.com
        </Link>
        .
      </Typography>
    </Box>
  );
}

export default function Quality(): JSX.Element {
  return (
    <Stack spacing={2} sx={{ padding: 2 }}>
      <Typography variant="h3" gutterBottom>
        Quality
      </Typography>

      <DataSources />
      <AirQualityIndex />
      <SeaWaterQualityIndex />
      <Sources />
      <Disclaimer />
    </Stack>
  );
}
