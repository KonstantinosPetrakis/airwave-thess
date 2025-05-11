import React, { useState, useEffect, JSX } from "react";
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

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useTheme } from "@mui/material/styles";

import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { Polygon } from "react-leaflet/Polygon";
import { Tooltip } from "react-leaflet/Tooltip";

import {
  getColorFromIndicator,
  formatCellValue,
  makeAttributeHumanReadable,
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

  const color = getColorFromIndicator(indicator);

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
    <Stack>
      <Typography variant="h4" component="h1" sx={{ pt: 1 }}>
        AirWaveThess Report Creation
      </Typography>
      <Typography variant="body1">
        In this page you can create a report regarding sea water and air quality
        of Thessaloniki!
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

      <div style={{ height: "100px" }} />
    </Stack>
  );
}
