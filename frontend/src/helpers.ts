export const chartPalette = [
  "#A1D6E2", // pastel blue
  "#FBB4AE", // pastel pink
  "#B3DE69", // pastel lime
  "#FDB462", // pastel orange
  "#CAB2D6", // pastel purple
  "#FFCCBC", // pastel peach
  "#CCEBC5", // pastel mint
  "#FFFFB3", // pastel yellow
  "#8DD3C7", // pastel teal
  "#FCCDE5", // pastel lavender
  "#D9D9D9", // pastel gray
  "#BC80BD", // slightly deeper pastel purple
  "#FFED6F", // pastel yellow-gold
  "#C5E384", // pastel green
];

/**
 * This function takes the sea water indicator (0-100) and returns a color based on the value.
 * @param indicator - The sea water indicator value (0-100)
 * @returns A string representing the RGB color.
 */
export function getColorFromSeaWaterIndicator(indicator: number): string {
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
}

/**
 * This function takes the air quality indicator (1-6) and returns a color based on the value.
 * @param indicator - The air quality indicator value (1-6)
 * @returns A string representing the RGB color.
 */
export function getColorFromAirIndicator(indicator: number): string {
  if (indicator < 1) return "rgb(0,0,139)"; // Good - Dark blue
  if (indicator < 2) return "rgb(0, 119, 255)"; // Fair - Light blue
  if (indicator < 3) return "rgb(32, 194, 40)"; // Moderate - Green
  if (indicator < 4) return "rgb(192, 192, 25)"; // Health effects may be experienced - Yellow
  if (indicator < 5)
    return "rgb(255, 127, 0)"; // Unhealthy for sensitive groups - Orange
  else return "rgb(255, 0, 0)"; // Unhealthy - Red
}

/**
 * This function takes a string attribute and converts it to a human-readable format.
 */
export function makeAttributeHumanReadable(attribute: string): string {
  return attribute.replace("avg_", "").replace(/_/g, " ");
}

/**
 * This function takes a string attribute and converts it to a human-readable format for the chart.
 * @param value - The value to be formatted.
 * @returns A string representing the formatted value.
 */
export function formatCellValue(value: number | string | null): string {
  if (!value) return "N/A";
  if (typeof value === "string") return value;
  if (typeof value === "number")
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return "";
}
