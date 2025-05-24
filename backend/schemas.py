from typing import Literal, List
from datetime import date
from enum import Enum

from pydantic import BaseModel


class LocationName(str, Enum):
    AMPELOKIPI_MENEMENI = "Ampelokipi - Menemeni Municipality"
    CHALKIDONA = "Chalkidona Municipality"
    DELTA = "Delta Municipality"
    KALAMARIA = "Kalamaria Municipality"
    KORDELIO_EVOSMOS = "Kordelio - Evosmos Municipality"
    LAGADAS = "Municipality of Lagadas"
    NEAPOLI_SYKIES = "Municipality of Neapoli-Sykies"
    ORAIOKASTRO = "Oreokastro Municipality"
    PAVLOS_MELAS = "Pavlos Melas Municipality"
    PYLAIA_CHORTIATIS = "Municipality of Pylaia - Chortiatis"
    THERMAIKOS = "Thermaikos Municipality"
    THERMI = "Thermi Municipality"
    THESSALONIKI = "Municipality of Thessaloniki"
    VOLVI = "Volvi Municipality"
    THERMAIKOS_PORT = "Thermaikos Port"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class DateRange(BaseModel):
    from_date: date
    to_date: date


class ReportInvalidRange(BaseModel):
    error: str
    acceptable_date_range: DateRange


class Location(BaseModel):
    name: LocationName
    multi_polygons: list[list[list[tuple[float, float]]]]


class SeaWaterQuality(BaseModel):
    location: Literal[LocationName.THERMAIKOS_PORT]
    avg_temperature: float
    avg_dissolved_oxygen: float
    avg_dissolved_oxygen_percentage: float
    avg_arsenic: float
    avg_lead: float
    avg_cadmium: float
    avg_nickel: float
    avg_copper: float
    avg_water_quality_index: float


class ReportStoryViewSeaWaterPeriod(SeaWaterQuality):
    period: str


class AirQuality(BaseModel):
    location: LocationName
    avg_co: float
    avg_no: float | None  # sometimes there is no "no" data
    avg_no2: float
    avg_so2: float
    avg_o3: float
    avg_air_quality_index: float


class ReportStoryViewAirQualityPeriod(AirQuality):
    period: str


class AirQualityHistoryLine(BaseModel):
    location: LocationName
    values: list[float | None]  # not all locations have data for all months


class AirQualityHistory(BaseModel):
    labels: list[str]
    lines: list[AirQualityHistoryLine]


class WaterQualityHistoryLine(BaseModel):
    location: Literal[LocationName.THERMAIKOS_PORT]
    values: list[float]


class WaterQualityHistory(BaseModel):
    labels: list[str]
    lines: list[WaterQualityHistoryLine]


class Report(BaseModel):
    air_quality_story_view: list[ReportStoryViewAirQualityPeriod]
    sea_water_quality_story_view: list[ReportStoryViewSeaWaterPeriod]
    air_quality_data_view: list[AirQuality]
    sea_water_quality_data_view: list[SeaWaterQuality]
    air_quality_history: AirQualityHistory
    water_quality_history: WaterQualityHistory


class Message(BaseModel):
    role: MessageRole
    content: str


MessageList = List[Message]
