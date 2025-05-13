"""
This module is responsible for preprocessing the original data and saving it into TSV files.
Additionally, it loads the preprocessed data from the TSV files into dataframes so they can be used in the application.


If you plan to run this module manually, to preprocess the data yourself, you need to run this script as a module.
For example:
```bash
cd .. && python -m backend.data && cd backend
```

TODO: Update the original data because their outdated.
TODO: Upload the preprocessed data to Github Releases and decompress it.
"""

import json
import os

from thefuzz import fuzz
import pandas as pd
import numpy as np

from .schemas import LocationName


DATA_DIR = os.path.dirname(os.path.abspath(__file__)) + "/data"


def _preprocess_location_data() -> pd.DataFrame:
    location_data = json.load(
        open(f"{DATA_DIR}/osm-boundaries.geojson", encoding="utf-8")
    )
    thermaikos_data = pd.read_csv(f"{DATA_DIR}/maps-co-thermaikos.csv")
    location_df = pd.DataFrame(
        [
            {
                "name": feature["properties"]["name_en"],
                "multi_polygons": (
                    feature["geometry"]["coordinates"]
                    if feature["geometry"]["type"] == "MultiPolygon"
                    else [feature["geometry"]["coordinates"]]
                ),
            }
            for feature in location_data["features"]
        ]
    )

    location_df = pd.concat(
        [
            location_df,
            pd.DataFrame(
                [
                    {
                        "name": LocationName.THERMAIKOS_PORT,
                        "multi_polygons": [
                            [
                                list(
                                    map(
                                        list,
                                        zip(
                                            thermaikos_data["Longitude"].tolist(),
                                            thermaikos_data["Latitude"].tolist(),
                                        ),
                                    )
                                )
                            ]
                        ],
                    }
                ]
            ),
        ],
        ignore_index=True,
    )

    location_df.to_csv(f"{DATA_DIR}/location.tsv", index=False, sep="\t")
    return location_df


def _calculate_air_quality_index(row: pd.Series) -> float:
    levels = {
        "o3": [0, 50, 100, 130, 240, 380, 800],
        "no2": [0, 40, 90, 120, 210, 400, 600],
        "so2": [0, 100, 200, 350, 500, 750, 1000],
        "co": [0, 4400, 9400],
    }

    indicators = []
    for key in levels.keys():
        if key not in row:
            continue

        value = row[key]
        level_high = next((x for x in levels[key] if x >= value), None)
        level_low = next((x for x in reversed(levels[key]) if x <= value), None)
        index_low = levels[key].index(level_low) + 1
        index_high = levels[key].index(level_high) + 1


        indicator = index_low + (index_high - index_low) * (value - level_low) / (
            level_high - level_low
        )

        indicators.append(indicator)

    return max(indicators)


def _preprocess_air_quality_data(location_df: pd.DataFrame) -> pd.DataFrame:
    air_quality_dir = f"{DATA_DIR}/Air Quality"
    air_quality_files = {
        d: [
            os.path.join(air_quality_dir, d, f)
            for f in os.listdir(os.path.join(air_quality_dir, d))
        ]
        for d in os.listdir(air_quality_dir)
    }

    merged_df = pd.DataFrame()
    for location, files in air_quality_files.items():
        for file in files:
            df = pd.read_csv(file)

            # Some files have '_conc suffix' in the column names, make them consistent
            if "co_conc" in df.columns:
                df.rename(columns={"co_conc": "co"}, inplace=True)
                df.rename(columns={"no_conc": "no"}, inplace=True)
                df.rename(columns={"no2_conc": "no2"}, inplace=True)
                df.rename(columns={"so2_conc": "so2"}, inplace=True)
                df.rename(columns={"o3_conc": "o3"}, inplace=True)

            # Group by month, and calculate the mean of each month
            df["date"] = pd.to_datetime(df["time"]).dt.to_period("M")
            df_grouped = (
                df.groupby("date")[["co", "no", "no2", "so2", "o3"]]
                .mean()
                .reset_index()
            )

            df_grouped["year"] = df_grouped["date"].dt.year

            # Find the closet location using fuzzy matching
            closest_location = max(
                filter(
                    lambda location: location != LocationName.THERMAIKOS_PORT,
                    location_df["name"],
                ),
                key=lambda loc: fuzz.ratio(location.lower(), loc.lower()),
            )
            df_grouped["location"] = closest_location

            merged_df = pd.concat([merged_df, df_grouped], ignore_index=True)

    # Calculate the air quality index
    merged_df["air_quality_index"] = merged_df.apply(
        _calculate_air_quality_index, axis=1
    )
    merged_df.to_csv(f"{DATA_DIR}/air_quality.tsv", index=False, sep="\t")
    return merged_df


def _calculate_sea_water_quality_index(row: pd.Series) -> float:
    weights = {
        "arsenic": 0.15,
        "cadmium": 0.15,
        "copper": 0.1,
        "dissolved_oxygen_percentage": 0.25,
        "lead": 0.1,
        "nickel": 0.1,
        "temperature": 0.15,
    }

    threshold_concentration = {
        "arsenic": 0.012,
        "cadmium": 0.0055,
        "copper": 0.0013,
        "lead": 0.0044,
        "nickel": 0.07,
        "dissolved_oxygen_percentage": 100,
        "temperature": 20,
    }

    quality_index = 0
    for parameter, value in row.items():
        if (
            parameter not in weights
            or parameter not in threshold_concentration
            or pd.isna(value)
        ):
            continue

        weight = weights[parameter]
        threshold = threshold_concentration[parameter]

        if parameter == "temperature":
            score = max(0, 100 * (1 - abs(value - threshold) / 10))
        elif parameter == "dissolved_oxygen_percentage":
            score = min(value, threshold)
        else:
            score = max(0, 100 * (1 - value / threshold))

        quality_index += weight * score

    return quality_index


def _preprocess_sea_water_quality_data() -> pd.DataFrame:
    files = {
        int(f.split("_")[1]): os.path.join(f"{DATA_DIR}/Sea Water Quality", f)
        for f in os.listdir(f"{DATA_DIR}/Sea Water Quality")
    }
    columns = {
        "Θερμοκρασία": "temperature",
        "Θερμοκρασία κατά την λήψη του δείγματος": "temperature",
        "Διαλυμένο Οξυγόνο (mg/l)": "dissolved_oxygen",
        "Ποσοστό κορεσμού διαλυμένου οξυγόνου (% DO)": "dissolved_oxygen_percentage",
        "Διαλυμένο Οξυγόνο (%)": "dissolved_oxygen_percentage",
        "Αρσενικό (mg/l)": "arsenic",
        "Μόλυβδος (mg/l)": "lead",
        "Κάδμιο (mg/l)": "cadmium",
        "Νικέλιο (mg/l)": "nickel",
        "Χαλκός (mg/l)": "copper",
    }
    ratio_threshold = 75

    merged_df = pd.DataFrame()
    for year, file in files.items():
        # Read Excel, and Concatenate all sheets into a single dataframe
        df = pd.concat(
            pd.read_excel(
                file, sheet_name=None, usecols=["Parameter", "Result", "Unit"]
            ).values(),
            ignore_index=True,
        )

        # Make the units consistent
        # Parse the first float number from the 'Result' column
        df["Result"] = (
            df["Result"].astype(str).str.extract(r"([-+]?\d*\.\d+|\d+)").astype(float)
        )

        # If unit is μg/l, convert to mg/l
        df.loc[df["Unit"] == "μg/L", "Result"] = (
            df.loc[df["Unit"] == "μg/L", "Result"] / 1000
        )
        df.loc[df["Unit"] == "μg/l", "Unit"] = "mg/l"

        df["Parameter"] = df["Parameter"] + df["Unit"].replace(np.nan, "")
        df.drop(columns=["Unit"], inplace=True)

        # Make the parameters consistent
        for par in df["Parameter"].unique():
            closest_match = max(
                columns.keys(), key=lambda col: fuzz.ratio(par.lower(), col.lower())
            )
            closest_ratio = fuzz.ratio(par.lower(), closest_match.lower())

            if closest_ratio >= ratio_threshold:
                df.loc[df["Parameter"].str.lower() == par.lower(), "Parameter"] = (
                    columns[closest_match]
                )

        # Filter columns parameters not in the list
        df = df[df["Parameter"].isin(columns.values())].reset_index(drop=True)

        # Group by parameter and take mean of each parameter
        df = df.groupby("Parameter").agg({"Result": "mean"}).reset_index()
        df["year"] = year
        df_pivot = df.pivot(
            index="year", columns="Parameter", values="Result"
        ).reset_index()

        merged_df = pd.concat([merged_df, df_pivot], ignore_index=True)

    # Add the location column
    merged_df["location"] = LocationName.THERMAIKOS_PORT

    # Calculate the quality index
    merged_df["water_quality_index"] = merged_df.apply(
        _calculate_sea_water_quality_index, axis=1
    )

    merged_df.to_csv(f"{DATA_DIR}/sea_water_quality.tsv", index=False, sep="\t")


def preprocess_data():
    """
    This function preprocesses the original data and saves some new TSV files into the data directory.
    The original data can be found in [Github Releases](https://github.com/KonstantinosPetrakis/airwave-thess/releases/tag/original-data).
    """

    location_df = _preprocess_location_data()
    _preprocess_air_quality_data(location_df)
    _preprocess_sea_water_quality_data()


def _download_and_decompress_data():
    """
    This function downloads the preprocessed data from Github Releases and decompresses it.
    If data already exists, it does nothing.
    """
    pass


def load_data() -> dict[str, pd.DataFrame | dict]:
    """
    This function downloads the preprocessed TSV data from Github Releases and decompresses it.
    Then it loads the data into dataframes and sometimes into dictionaries to make API faster to return them instantly.
    """

    _download_and_decompress_data()

    location = pd.read_csv(f"{DATA_DIR}/location.tsv", sep="\t")
    location["multi_polygons"] = location["multi_polygons"].map(json.loads)

    return {
        "location": location,
        "location_dict": location.to_dict(orient="records"),
        "air_quality": pd.read_csv(f"{DATA_DIR}/air_quality.tsv", sep="\t"),
        "sea_water_quality": pd.read_csv(f"{DATA_DIR}/sea_water_quality.tsv", sep="\t"),
    }


if __name__ == "__main__":
    preprocess_data()
