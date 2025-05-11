export function getColorFromIndicator(indicator: number): string {
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

export function makeAttributeHumanReadable(attribute: string): string {
  return attribute.replace("avg_", "").replace(/_/g, " ");
}

export function formatCellValue(value: number | string | null): string {
  if (!value) return "N/A";
  if (typeof value === "string") return value;
  if (typeof value === "number")
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return "";
}
