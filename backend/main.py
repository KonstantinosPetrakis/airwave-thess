from datetime import date

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query, status
from fastapi.responses import JSONResponse
import numpy as np
import pandas as pd

from .schemas import Location, Report, DateRange, ReportInvalidRange
from .data import load_data
from . import helpers


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data = load_data()
location_dict, air_quality, sea_water_quality = (
    data["location_dict"],
    data["air_quality"],
    data["sea_water_quality"],
)


@app.get("/locations")
def locations() -> list[Location]:
    return location_dict


@app.get(f"/date-range")
def date_range() -> DateRange:
    min_air_quality_date = pd.to_datetime(air_quality["date"].min())
    min_sea_water_quality_date = pd.to_datetime(str(sea_water_quality["year"].min()))
    max_air_quality_date = pd.to_datetime(air_quality["date"].max())
    max_sea_water_quality_date = pd.to_datetime(str(sea_water_quality["year"].max()))

    return {
        "from_date": min(min_air_quality_date, min_sea_water_quality_date).date(),
        "to_date": max(max_air_quality_date, max_sea_water_quality_date).date(),
    }


@app.get(
    "/report", responses={200: {"model": Report}, 422: {"model": ReportInvalidRange}}
)
def report(
    from_date: date = Query(example="2020-01-01"),
    to_date: date = Query(example="2024-12-01"),
) -> Report:

    acceptable_date_range = date_range()

    if (
        from_date < acceptable_date_range["from_date"]
        or to_date > acceptable_date_range["to_date"]
    ):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Date range is out of bounds",
                "acceptable_date_range": {
                    "from_date": acceptable_date_range["from_date"].isoformat(),
                    "to_date": acceptable_date_range["to_date"].isoformat(),
                },
            },
        )

    from_date = pd.Timestamp(from_date)
    to_date = pd.Timestamp(to_date)

    # Air Quality Story View
    air_quality_story_view = air_quality.groupby(
        ["location", "year"], as_index=False
    ).mean(numeric_only=True)

    air_quality_story_view = helpers.rename_air_quality_columns(air_quality_story_view)
    air_quality_story_view = air_quality_story_view.replace(np.nan, None).to_dict(
        orient="records"
    )

    # Water Quality Story View
    sea_water_quality_story_view = sea_water_quality.copy()
    sea_water_quality_story_view = helpers.rename_sea_water_quality_columns(
        sea_water_quality_story_view
    )

    sea_water_quality_story_view = sea_water_quality_story_view.to_dict(
        orient="records"
    )

    # Air Quality Data View
    air_quality_data_view = air_quality.copy()
    air_quality_data_view["date"] = pd.to_datetime(
        air_quality_data_view["date"], format="%Y-%m"
    )
    air_quality_data_view = air_quality_data_view[
        air_quality_data_view["date"].between(from_date, to_date, inclusive="both")
    ]
    air_quality_data_view = air_quality_data_view.groupby(["location"], as_index=False)
    air_quality_filtered_and_grouped = air_quality_data_view
    air_quality_data_view = air_quality_data_view.mean(numeric_only=True)

    air_quality_data_view = air_quality_data_view.drop(columns=["year"])

    air_quality_data_view = helpers.rename_air_quality_columns(air_quality_data_view)

    air_quality_data_view = air_quality_data_view.replace(np.nan, None).to_dict(
        orient="records"
    )

    # Sea Water Quality Data View
    sea_water_quality_data_view = sea_water_quality.copy()
    sea_water_quality_data_view["date"] = pd.to_datetime(
        sea_water_quality_data_view["year"], format="%Y"
    )
    sea_water_quality_data_view = sea_water_quality_data_view[
        sea_water_quality_data_view["date"].between(
            from_date, to_date, inclusive="both"
        )
    ]
    sea_water_quality_data_view = sea_water_quality_data_view.drop(columns=["year"])
    sea_water_quality_data_view = pd.DataFrame(
        [sea_water_quality_data_view.mean(numeric_only=True)]
    )
    sea_water_quality_data_view["location"] = sea_water_quality["location"][0]

    sea_water_quality_data_view = helpers.rename_sea_water_quality_columns(
        sea_water_quality_data_view
    )

    sea_water_quality_data_view = sea_water_quality_data_view.replace(
        np.nan, None
    ).to_dict(orient="records")

    # Air Quality History
    # Prepare the grouped data
    aq_grouped = air_quality_filtered_and_grouped.obj

    # Get all months per location
    aq_grouped["month"] = aq_grouped["date"].dt.strftime("%Y-%m")
    months_per_location = aq_grouped.groupby("location")["month"].apply(list)
    counts_per_location = months_per_location.apply(len)

    # Find the location with the most months
    main_location = counts_per_location.idxmax()
    labels = sorted(set(months_per_location[main_location]))

    # Build lines for each location
    lines = []
    for location in months_per_location.keys():
        # Map month to air_quality_index
        loc_df = aq_grouped[aq_grouped["location"] == location]
        month_to_index = dict(zip(loc_df["month"], loc_df["air_quality_index"]))
        values = [month_to_index.get(label, None) for label in labels]
        lines.append(
            {
                "location": location,
                "values": values,
            }
        )

    air_quality_history = {
        "labels": labels,
        "lines": lines,
    }

    # Water Quality History
    sea_water_quality_sorted = sea_water_quality.sort_values("year")
    labels = sea_water_quality_sorted["year"].astype(str).tolist()
    values = sea_water_quality_sorted["water_quality_index"].tolist()
    water_quality_history = {
        "labels": labels,
        "lines": [
            {
                "location": sea_water_quality_sorted["location"].iloc[0],
                "values": values,
            }
        ],
    }

    return {
        "air_quality_story_view": air_quality_story_view,
        "sea_water_quality_story_view": sea_water_quality_story_view,
        "air_quality_data_view": air_quality_data_view,
        "sea_water_quality_data_view": sea_water_quality_data_view,
        "air_quality_history": air_quality_history,
        "water_quality_history": water_quality_history,
    }
