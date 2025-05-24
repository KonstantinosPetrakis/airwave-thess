import { Dayjs } from "dayjs";

import { Location, Report, MessageList } from "./types";

const API_URL = `${import.meta.env.VITE_API_HOST}/api`;

export async function getLocations(): Promise<Location[]> {
  const response = await fetch(`${API_URL}/locations`);
  return response.json();
}

export async function getReport(
  from_date: Dayjs,
  to_date: Dayjs
): Promise<Report | string> {
  const response = await fetch(
    `${API_URL}/report?from_date=${from_date.format(
      "YYYY-MM-DD"
    )}&to_date=${to_date.format("YYYY-MM-DD")}`
  );

  if (response.ok) return response.json();

  const errorData = await response.json();
  return `Acceptable date range is between ${errorData.acceptable_date_range.from_date} and ${errorData.acceptable_date_range.to_date}`;
}

export async function sendMessage(messages: MessageList): Promise<MessageList> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) throw new Error("Failed to send message");
  return response.json();
}
