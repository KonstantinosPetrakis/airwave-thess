import json
import os

from thefuzz import fuzz
import pandas as pd
import numpy as np


def preprocess_data():
    """
    This function preprocesses the original data and saves some new TSV files into the data directory.
    The original data can be found in [Github Releases](https://github.com/KonstantinosPetrakis/airwave-thess/releases/tag/original-data).
    """

    # Preprocess location data and save it to a TSV file
    location_data = json.load(open("./data/osm-boundaries.geojson", encoding="utf-8"))
    location_df = pd.DataFrame(
        [
            {
                "name": feature["properties"]["name_en"],
                "coordinates": feature["geometry"]["coordinates"],
            }
            for feature in location_data["features"]
        ]
    )
    location_df.to_csv("./data/location.tsv", index=False, sep="\t")

    # Preprocess air quality data and save it to a TSV file
    air_quality_dir = "./data/Air Quality"
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

            # Find the closet location using fuzzy matching
            closest_location = max(
                location_df["name"].tolist(),
                key=lambda loc: fuzz.ratio(location.lower(), loc.lower()),
            )
            df_grouped["location"] = closest_location

            merged_df = pd.concat([merged_df, df_grouped], ignore_index=True)

    merged_df.to_csv("./data/air_quality.tsv", index=False, sep="\t")

    # Preprocess sea water data and save it to a TSV file
    files = {
        int(f.split("_")[1]): os.path.join("./data/Sea Water Quality", f)
        for f in os.listdir("./data/Sea Water Quality")
    }
    columns = {
        "Θερμοκρασία": "temperature (c)",
        "Θερμοκρασία κατά την λήψη του δείγματος": "temperature (c)",
        "Διαλυμένο Οξυγόνο (mg/l)": "dissolved oxygen (mg/l)",
        "Ποσοστό κορεσμού διαλυμένου οξυγόνου (% DO)": "dissolved oxygen (%)",
        "Διαλυμένο Οξυγόνο (%)": "dissolved oxygen (%)",
        "pH": "pH",
        "Αρσενικό (mg/l)": "arsenic (mg/l)",
        "Μόλυβδος (mg/l)": "lead (mg/l)",
        "Κάδμιο (mg/l)": "cadmium (mg/l)",
        "Νικέλιο (mg/l)": "nickel (mg/l)",
        "Χαλκός (mg/l)": "copper (mg/l)",
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

        # If not unit is present for Ph, set it to pH
        df.loc[df["Parameter"] == "pH", "Unit"] = "Μονάδες pH"

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
        df["Year"] = year
        df_pivot = df.pivot(
            index="Year", columns="Parameter", values="Result"
        ).reset_index()

        merged_df = pd.concat([merged_df, df_pivot], ignore_index=True)

    merged_df.to_csv("./data/sea_water_quality.tsv", index=False, sep="\t")


def download_and_decompress_data():
    """
    This function downloads the preprocessed data from Github Releases and decompresses it.
    """
    pass


def load_data():
    """
    This function loads the preprocessed data from the TSV files into dataframes.
    """
    pass


if __name__ == "__main__":
    # preprocess_data()
    download_and_decompress_data()
