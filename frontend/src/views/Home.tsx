import React, { useState, useEffect, JSX } from "react";
import { Link } from "react-router";
import dayjs, { Dayjs } from "dayjs";

import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import FormControl from "@mui/material/FormControl";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Autocomplete from "@mui/material/Autocomplete";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { ChartsLegendProps, LineSeriesType } from "@mui/x-charts";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { useTheme } from "@mui/material/styles";

import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { Polygon } from "react-leaflet/Polygon";
import { Tooltip } from "react-leaflet/Tooltip";

import {
  getColorFromSeaWaterIndicator,
  getColorFromAirIndicator,
  formatCellValue,
  makeAttributeHumanReadable,
  chartPalette,
} from "../helpers";
import Loader from "../components/Loader";
import {
  AirQuality,
  Location,
  LocationName,
  Report,
  SeaWaterQuality,
} from "../types";
import { getLocations, getReport } from "../network";

type ViewMode = "data_mode" | "story_mode" | "compare_mode";

type LineSeries = LineSeriesType & {
  label: string; // Don't plan to use the callback function
  hidden?: boolean; // Add a hidden property to the LineSeries type so we can use it in the legend
};

function ReportFilters({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  dateError,
  viewMode,
  setViewMode,
  compareLocations,
  setCompareLocations,
  locations,
}: {
  dateFrom: Dayjs | null;
  setDateFrom: React.Dispatch<React.SetStateAction<Dayjs | null>>;
  dateTo: Dayjs | null;
  setDateTo: React.Dispatch<React.SetStateAction<Dayjs | null>>;
  dateError: string;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  compareLocations: Location[];
  setCompareLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  locations: Location[];
}): JSX.Element {
  return (
    <Stack sx={{ width: { xs: "100%", lg: "50%" } }}>
      <Typography variant="h6" gutterBottom>
        Date Range
      </Typography>
      <Stack direction="row" spacing={2}>
        <DatePicker
          label="From date"
          sx={{ flex: 1 }}
          value={dateFrom}
          onChange={setDateFrom}
          views={["month", "year"]}
        />
        <DatePicker
          label="To date"
          sx={{ flex: 1 }}
          value={dateTo}
          onChange={setDateTo}
          views={["month", "year"]}
        />
      </Stack>
      {!!dateError && (
        <Alert severity="error" sx={{ my: 1 }}>
          {dateError}
        </Alert>
      )}
      <Typography variant="h6" gutterBottom>
        View Mode
      </Typography>
      <FormControl>
        <RadioGroup
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as ViewMode)}
        >
          <FormControlLabel
            control={<Radio />}
            value="data_mode"
            label="Data Mode"
          />
          <FormControlLabel
            control={<Radio />}
            value="story_mode"
            label="Story Mode"
          />
          <FormControlLabel
            control={<Radio />}
            value="compare_mode"
            label="Compare Mode"
          />
        </RadioGroup>
      </FormControl>
      {viewMode === "compare_mode" && (
        <>
          <Typography variant="h6" gutterBottom>
            Locations to Compare
          </Typography>
          <Autocomplete
            multiple
            options={locations.filter(
              (location) => location.name !== LocationName.THERMAIKOS_PORT
            )}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select locations to compare"
                placeholder="Locations"
              />
            )}
            value={compareLocations}
            onChange={(_, value) => setCompareLocations(value)}
          />
        </>
      )}
    </Stack>
  );
}

function ComparisonTable({
  report,
  compareLocations,
}: {
  report: Report;
  compareLocations: Location[];
}): JSX.Element {
  const airQualityColumns = Object.keys(
    report?.air_quality_data_view[0] || []
  ) as (keyof AirQuality)[];

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Location Comparison
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {airQualityColumns.map((col) => (
                <TableCell key={col}>
                  {makeAttributeHumanReadable(col)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {compareLocations.map((location) => (
              <TableRow>
                {airQualityColumns.map((col) => (
                  <TableCell>
                    {formatCellValue(
                      report.air_quality_data_view.filter(
                        (data) => data.location === location.name
                      )[0]?.[col]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function LocationMultiPolygon({
  location,
  report,
  viewMode,
  year,
}: {
  location: Location;
  report: Report;
  viewMode: ViewMode;
  year: number | null;
}): JSX.Element {
  const theme = useTheme();
  const isSeaWaterQuality = location.name === LocationName.THERMAIKOS_PORT;
  let qualityObject: SeaWaterQuality | AirQuality;

  if (viewMode === "story_mode") {
    const qualityObjs = isSeaWaterQuality
      ? report.sea_water_quality_story_view
      : report.air_quality_story_view;

    qualityObject = qualityObjs.filter(
      (r) => r.location === location.name && r.year === year
    )[0];
  } else {
    const qualityObjs = isSeaWaterQuality
      ? report.sea_water_quality_data_view
      : report.air_quality_data_view;

    qualityObject = qualityObjs.filter((r) => r.location === location.name)[0];
  }

  // If no data is found for the location, return an empty fragment
  if (!qualityObject) return <></>;

  const indicator = isSeaWaterQuality
    ? (qualityObject as SeaWaterQuality).avg_water_quality_index
    : (qualityObject as AirQuality).avg_air_quality_index;

  const color = isSeaWaterQuality
    ? getColorFromSeaWaterIndicator(indicator)
    : getColorFromAirIndicator(indicator);

  return (
    <>
      {location.multi_polygons.map((multiPolygon) =>
        multiPolygon.map((coordinates, index) => (
          <Polygon
            key={`${location.name}-${index}`}
            positions={coordinates.map((coordinate) => [
              coordinate[1],
              coordinate[0],
            ])}
            pathOptions={{
              color: theme.palette.primary.main,
              fillColor: color,
              fillOpacity: 0.75,
            }}
          >
            <Tooltip>
              <Typography variant="body1" fontWeight="bold">
                {location.name} - {indicator.toFixed(2)}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Attribute</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(qualityObject).map(([attribute, value]) => (
                      <TableRow
                        key={attribute}
                        sx={{
                          backgroundColor: attribute.includes("quality")
                            ? "primary.main"
                            : undefined,
                        }}
                      >
                        <TableCell>
                          {makeAttributeHumanReadable(attribute)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCellValue(value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Tooltip>
          </Polygon>
        ))
      )}
    </>
  );
}

function StoryStepper({
  viewMode,
  steps,
  currentStep,
  setCurrentStep,
}: {
  viewMode: ViewMode;
  steps: number[];
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}): JSX.Element {
  const [userReacted, setUserReacted] = useState(false);

  // Reset the user reaction when the view mode changes
  useEffect(() => {
    setUserReacted(false);
  }, [viewMode]);

  // If the user has not reacted make story mode auto-play, if user has reacted stop auto-play
  useEffect(() => {
    if (viewMode !== "story_mode") return;

    const interval = setInterval(() => {
      if (!userReacted) setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [setCurrentStep, userReacted, steps, viewMode]);

  if (viewMode !== "story_mode") return <></>;

  return (
    <Stack direction="row">
      <Button
        sx={{ fontSize: "2rem" }}
        title="Previous"
        disabled={currentStep === 0}
        onClick={() => {
          setCurrentStep((prev) => prev - 1);
          setUserReacted(true);
        }}
      >
        -
      </Button>
      <Stepper
        activeStep={currentStep}
        sx={{
          my: 1,
          flexWrap: "wrap",
          gap: 1,
          justifyContent: "center",
        }}
      >
        {steps.map((year) => (
          <Step key={year}>
            <StepLabel>{year}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Button
        sx={{ fontSize: "2rem" }}
        title="Next"
        disabled={currentStep === steps.length - 1}
        onClick={() => {
          setCurrentStep((prev) => prev + 1);
          setUserReacted(true);
        }}
      >
        +
      </Button>
    </Stack>
  );
}

function Map({
  viewMode,
  compareLocations,
  locations,
  report,
}: {
  viewMode: ViewMode;
  compareLocations: Location[];
  locations: Location[];
  report: Report;
}): JSX.Element {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = report.air_quality_story_view
    .map((r) => r.year)
    .concat(report.sea_water_quality_story_view.map((r) => r.year))
    .filter((year, index, self) => self.indexOf(year) === index)
    .sort();

  return (
    <Stack sx={{ width: "100%" }}>
      <StoryStepper
        viewMode={viewMode}
        steps={steps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />
      <MapContainer
        style={{ height: "700px", backgroundColor: "transparent" }}
        center={[40.68, 23.15]}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        zoomControl={false}
        zoom={9.5}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {(viewMode === "compare_mode" ? compareLocations : locations).map(
          (location) => (
            <LocationMultiPolygon
              key={location.name}
              location={location}
              report={report}
              viewMode={viewMode}
              year={steps[currentStep]}
            />
          )
        )}
      </MapContainer>
    </Stack>
  );
}

function ToggleLegend({
  lines,
  setLines,
}: {
  lines: LineSeries[];
  setLines: React.Dispatch<React.SetStateAction<LineSeries[]>>;
}): JSX.Element {
  const handleToggle = (line: LineSeries) => {
    console.log(line);
    setLines((prevLines) =>
      prevLines.map((l) =>
        l.label === line.label ? { ...l, hidden: !l.hidden } : l
      )
    );
  };

  return (
    <Stack
      component="ul"
      direction="row"
      flexWrap="wrap"
      spacing={2}
      justifyContent="center"
      alignItems="center"
      sx={{ listStyle: "none", padding: 0 }}
    >
      {lines.map((line) => (
        <Stack
          key={`${line.label}-legend`}
          component="li"
          direction="row"
          alignItems="center"
          spacing={0.5}
          onClick={() => handleToggle(line)}
          sx={{
            cursor: "pointer",
            textDecoration: line.hidden ? "line-through" : "none",
            "&:hover": {
              filter: "brightness(1.1)",
            },
          }}
        >
          <Box
            sx={{
              height: "0.22rem",
              width: "1rem",
              backgroundColor: line.color,
            }}
          />
          <Typography fontSize="0.75rem">{line.label} </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function HistoricalTrends({ report }: { report: Report }): JSX.Element {
  const [airQualityLines, setAirQualityLines] = useState<LineSeries[]>([]);
  const [seaWaterQualityLines, setSeaWaterQualityLines] = useState<
    LineSeries[]
  >([]);

  useEffect(() => {
    const airQualityLines = report.air_quality_history.lines.map((line, i) => ({
      name: line.location,
      label: line.location,
      color: chartPalette[i % chartPalette.length],
      data: line.values,
      showMark: false,
      type: "line" as const,
    }));

    const seaWaterQualityLines = report.water_quality_history.lines.map(
      (line, i) => ({
        name: line.location,
        label: line.location,
        color: chartPalette[i % chartPalette.length],
        data: line.values,
        showMark: false,
        type: "line" as const,
      })
    );

    setAirQualityLines(airQualityLines);
    setSeaWaterQualityLines(seaWaterQualityLines);
  }, [report]);

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Historical Trends
      </Typography>

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        height={{ xs: "100%", lg: "400px" }}
        alignContent="center"
      >
        <Stack width={{ xs: "100%", lg: "50%" }} direction="column">
          <Typography gutterBottom>Air Quality</Typography>
          <LineChart
            title="Air Quality"
            xAxis={[
              {
                data: report.air_quality_history.labels,
                scaleType: "band",
              },
            ]}
            series={airQualityLines.filter((line) => !line.hidden)}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            sx={{ height: "100%" }}
            slots={{ legend: ToggleLegend as React.FC<ChartsLegendProps> }}
            slotProps={{
              legend: {
                lines: airQualityLines,
                setLines: setAirQualityLines,
              } as ChartsLegendProps,
            }}
          />
        </Stack>
        <Stack width={{ xs: "100%", lg: "50%" }} direction="column">
          <Typography gutterBottom>Sea Water Quality</Typography>
          <LineChart
            title="Sea Water Quality"
            xAxis={[
              {
                data: report.water_quality_history.labels,
                scaleType: "band",
              },
            ]}
            series={seaWaterQualityLines.filter((line) => !line.hidden)}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            sx={{ height: "100%" }}
            slots={{ legend: ToggleLegend as React.FC<ChartsLegendProps> }}
            slotProps={{
              legend: {
                lines: seaWaterQualityLines,
                setLines: setSeaWaterQualityLines,
              } as ChartsLegendProps,
            }}
          />
        </Stack>
      </Stack>
    </>
  );
}

export function TopAreas({ report }: { report: Report }): JSX.Element {
  const theme = useTheme();

  const [metric, setMetric] = useState<
    "avg_air_quality_index" | "avg_co" | "avg_no2" | "avg_so2" | "avg_o3"
  >("avg_air_quality_index");

  const metrics = [
    "avg_air_quality_index",
    "avg_co",
    "avg_no2",
    "avg_so2",
    "avg_o3",
  ];

  const metricsLabels = metrics.map((m) => makeAttributeHumanReadable(m));

  const topAreas = report.air_quality_data_view
    .sort((a, b) => a[metric] - b[metric])
    .slice(0, 5);

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Areas with the best Air Quality
      </Typography>

      <Tabs value={metric} onChange={(_, newValue) => setMetric(newValue)}>
        {metrics.map((metric, index) => (
          <Tab key={metric} label={metricsLabels[index]} value={metric} />
        ))}
      </Tabs>

      <BarChart
        title="Top Areas"
        layout="horizontal"
        xAxis={[
          {
            scaleType: "linear",
          },
        ]}
        yAxis={[
          {
            data: topAreas.map((area) => area.location),
            scaleType: "band",
            width: 250,
          },
        ]}
        series={[
          {
            data: topAreas.map((area) => area[metric] ?? 0),
            type: "bar",
            color: theme.palette.primary.main,
          },
        ]}
        margin={{ top: 10, right: 10, bottom: 10, left: 60 }}
        sx={{ width: "100%", height: "300px" }}
      />
    </>
  );
}

export default function Home(): JSX.Element {
  // ------------ Filters State ------------
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(dayjs("2020-01-01"));
  const [dateTo, setDateTo] = useState<Dayjs | null>(dayjs("2024-12-01"));
  const [dateRangeError, setDateRangeError] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("data_mode");

  // ------------ Fetched Data State ------------
  const [locations, setLocations] = useState<Location[]>([]);
  const [report, setReport] = useState<Report | null>(null);

  // ------------ Other states ------------
  const [compareLocations, setCompareLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // ------------ Effects ------------
  useEffect(() => {
    (async () => {
      setLoading(true);
      setLocations(await getLocations());
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!dateFrom || !dateTo)
        return setDateRangeError("Please select a date range");
      else if (dateFrom.isAfter(dateTo))
        return setDateRangeError("Invalid date range");
      else setDateRangeError("");

      setLoading(true);
      const report = await getReport(dateFrom, dateTo);
      setLoading(false);

      if (typeof report === "string") return setDateRangeError(report);
      setReport(report);
    })();
  }, [dateFrom, dateTo]);

  // ------------ Render ------------
  if (loading || !report) return <Loader />;

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1" sx={{ pt: 1 }}>
        AirWaveThess Report Overview
      </Typography>

      <Typography variant="body1">
        In this page you can create a report regarding sea water and air{" "}
        <MuiLink component={Link} to="/indexes">
          quality
        </MuiLink>{" "}
        in the area of Thessaloniki!
      </Typography>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={1} sx={{ mt: 3 }}>
        <ReportFilters
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          dateError={dateRangeError}
          viewMode={viewMode}
          setViewMode={setViewMode}
          compareLocations={compareLocations}
          setCompareLocations={setCompareLocations}
          locations={locations}
        />

        <Map
          viewMode={viewMode}
          compareLocations={compareLocations}
          locations={locations}
          report={report}
        />
      </Stack>

      {viewMode === "compare_mode" && (
        <ComparisonTable report={report} compareLocations={compareLocations} />
      )}

      <HistoricalTrends report={report} />

      <TopAreas report={report} />
    </Stack>
  );
}
