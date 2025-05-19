export enum LocationName {
  AMPELOKIPI_MENEMENI = "Ampelokipi - Menemeni Municipality",
  CHALKIDONA = "Chalkidona Municipality",
  DELTA = "Delta Municipality",
  KALAMARIA = "Kalamaria Municipality",
  KORDELIO_EVOSMOS = "Kordelio - Evosmos Municipality",
  LAGADAS = "Municipality of Lagadas",
  NEAPOLI_SYKIES = "Municipality of Neapoli-Sykies",
  ORAIOKASTRO = "Oreokastro Municipality",
  PAVLOS_MELAS = "Pavlos Melas Municipality",
  PYLAIA_CHORTIATIS = "Municipality of Pylaia - Chortiatis",
  THERMAIKOS = "Thermaikos Municipality",
  THERMI = "Thermi Municipality",
  THESSALONIKI = "Municipality of Thessaloniki",
  VOLVI = "Volvi Municipality",
  THERMAIKOS_PORT = "Thermaikos Port",
}

export interface DateRange {
  from_date: string;
  to_date: string;
}

export interface ReportInvalidRange {
  error: string;
  acceptable_date_range: DateRange;
}

export interface Location {
  name: LocationName;
  multi_polygons: [[[[number, number]]]];
}

export interface SeaWaterQuality {
  location: LocationName.THERMAIKOS_PORT;
  avg_temperature: number;
  avg_dissolved_oxygen: number;
  avg_dissolved_oxygen_percentage: number;
  avg_arsenic: number;
  avg_lead: number;
  avg_cadmium: number;
  avg_nickel: number;
  avg_copper: number;
  avg_water_quality_index: number;
}

export interface ReportStoryViewSeaWaterPeriod extends SeaWaterQuality {
  period: string;
}

export interface AirQuality {
  location: LocationName;
  avg_co: number;
  avg_no: number | null;
  avg_no2: number;
  avg_so2: number;
  avg_o3: number;
  avg_air_quality_index: number;
}

export interface ReportStoryViewAirQualityPeriod extends AirQuality {
  period: string;
}

export interface AirQualityHistoryLine {
  location: LocationName;
  values: (number | null)[];
}

export interface AirQualityHistory {
  labels: string[];
  lines: AirQualityHistoryLine[];
}

export interface WaterQualityHistoryLine {
  location: LocationName.THERMAIKOS_PORT;
  values: number[];
}

export interface WaterQualityHistory {
  labels: string[];
  lines: WaterQualityHistoryLine[];
}

export interface Report {
  air_quality_story_view: ReportStoryViewAirQualityPeriod[];
  sea_water_quality_story_view: ReportStoryViewSeaWaterPeriod[];
  air_quality_data_view: AirQuality[];
  sea_water_quality_data_view: SeaWaterQuality[];
  air_quality_history: AirQualityHistory;
  water_quality_history: WaterQualityHistory;
}
