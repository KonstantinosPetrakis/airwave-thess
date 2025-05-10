import pandas as pd


def rename_colors_to_avg(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    """
    Rename columns in the DataFrame to have 'avg_' prefix for specified columns.

    Args:
        df (pd.DataFrame): The DataFrame to rename columns in.
        cols (list[str]): List of column names to rename.

    Returns:
        pd.DataFrame: The DataFrame with renamed columns.
    """

    return df.rename(columns={col: f"avg_{col}" for col in cols})


def rename_air_quality_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Rename columns in the DataFrame to have 'avg_' prefix for air quality columns.

    Args:
        df (pd.DataFrame): The DataFrame to rename columns in.

    Returns:
        pd.DataFrame: The DataFrame with renamed columns.
    """

    return rename_colors_to_avg(
        df,
        [
            "co",
            "no",
            "no2",
            "so2",
            "o3",
            "air_quality_index",
        ],
    )


def rename_sea_water_quality_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Rename columns in the DataFrame to have 'avg_' prefix for sea water quality columns.

    Args:
        df (pd.DataFrame): The DataFrame to rename columns in.

    Returns:
        pd.DataFrame: The DataFrame with renamed columns.
    """

    return rename_colors_to_avg(
        df,
        [
            "temperature",
            "dissolved_oxygen",
            "dissolved_oxygen_percentage",
            "ph",
            "arsenic",
            "lead",
            "cadmium",
            "nickel",
            "copper",
            "water_quality_index",
        ],
    )
