import { Dayjs } from "dayjs";

import { Location, Report } from "./types";

const API_HOST = import.meta.env.VITE_API_HOST;

export async function getLocations(): Promise<Location[]> {
  const response = await fetch(`${API_HOST}/locations`);
  return response.json();
}

export async function getReport(
  from_date: Dayjs,
  to_date: Dayjs
): Promise<Report | string> {
  const response = await fetch(
    `${API_HOST}/report?from_date=${from_date.format(
      "YYYY-MM-DD"
    )}&to_date=${to_date.format("YYYY-MM-DD")}`
  );

  if (response.ok) return response.json();

  const errorData = await response.json();
  return `Acceptable date range is between ${errorData.acceptable_date_range.from_date} and ${errorData.acceptable_date_range.to_date}`;
}
