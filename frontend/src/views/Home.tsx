import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";

import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useTheme } from "@mui/material/styles";

import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { Polygon } from "react-leaflet/Polygon";
import { Tooltip } from "react-leaflet/Tooltip";

import { Location, LocationName, Report } from "../types";
import { getLocations, getReport } from "../network";

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(dayjs("2020-01-01"));
  const [dateTo, setDateTo] = useState<Dayjs | null>(dayjs("2024-12-01"));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLocations(await getLocations());
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!dateFrom || !dateTo) return setError("Please select a date range");
      else if (dateFrom.isAfter(dateTo)) return setError("Invalid date range");
      else setError("");

      setLoading(true);
      const report = await getReport(dateFrom, dateTo);
      setLoading(false);
      if (typeof report === "string") return setError(report);
      setReport(report);
    })();
  }, [dateFrom, dateTo]);

  const colorFromIndicator = (indicator: number): string => {
    let r, g, b;
    if (indicator <= 50) {
      // Green to Yellow
      r = Math.round((255 * indicator) / 50);
      g = 255;
      b = 0;
    } else {
      // Yellow to Red
      r = 255;
      g = Math.round(255 - (255 * (indicator - 50)) / 50);
      b = 0;
    }
    return `rgb(${r},${g},${b})`;
  };

  const getAvgIndicator = (location: Location): number | undefined =>
    location.name === LocationName.THERMAIKOS_PORT
      ? report?.sea_water_quality_data_view.filter(
          (data) => data.location === location.name
        )[0]?.avg_water_quality_index
      : report?.air_quality_data_view.filter(
          (data) => data.location === location.name
        )[0]?.avg_air_quality_index;

  const colorFromLocation = (location: Location): string => {
    const indicator = getAvgIndicator(location);
    return indicator ? colorFromIndicator(indicator) : "#000000";
  };

  if (loading)
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

  return (
    <Stack spacing={1}>
      <Typography variant="h4" component="h1" sx={{ pt: 1 }}>
        AirWaveThess Report Creation
      </Typography>
      <Typography variant="body1" gutterBottom>
        In this page you can create a report regarding sea water and air quality
        of Thessaloniki!
      </Typography>

      <Typography variant="h5" component="h2" gutterBottom>
        Report Filters
      </Typography>
      <Stack>
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
        {!!error && (
          <Alert severity="error" sx={{ my: 1 }}>
            {error}
          </Alert>
        )}
      </Stack>

      <Typography variant="h5" component="h2" gutterBottom>
        Report Overview
      </Typography>
      <MapContainer
        style={{ height: "700px" }}
        center={[40.6401, 22.9144]}
        maxBounds={[
          [40.35, 22.2],
          [41.0, 24.0],
        ]}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        zoomControl={false}
        zoom={10}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {locations.map((location) =>
          location.multi_polygons.map((multiPolygon) =>
            multiPolygon.map((coordinates, index) => (
              <Polygon
                key={`${location.name}-${index}`}
                positions={coordinates.map((coordinate) => [
                  coordinate[1],
                  coordinate[0],
                ])}
                pathOptions={{
                  color: theme.palette.primary.main,
                  fillColor: colorFromLocation(location),
                  fillOpacity: 0.75,
                }}
              >
                <Tooltip>
                  <Typography variant="body1" fontWeight="bold">
                    {location.name} - {getAvgIndicator(location)?.toFixed(2)}
                  </Typography>
                  {/* <DataGrid columns={}></DataGrid> */}
                </Tooltip>
              </Polygon>
            ))
          )
        )}
      </MapContainer>
    </Stack>
  );
}
