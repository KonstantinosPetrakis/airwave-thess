"""
Because of an Issue with Ollama, we can't stream the response when using tools, so we will return it as a single message.
When this is fixed: https://github.com/ollama/ollama/issues/9632 we can use the streaming response and send the messages as they come in with websockets.

At this point, the messages are sent to the frontend, If the frontend wants, it can mess with assistant messages because they're not stored in the backend.
We just choose to ignore because the app is not production ready.
"""

from datetime import date

from dotenv import dotenv_values
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query, Body, status
from fastapi.responses import JSONResponse
from pandasql import sqldf
import numpy as np
import pandas as pd
import ollama

from .schemas import Location, Report, DateRange, ReportInvalidRange, MessageList
from .data import load_data
from . import helpers


CONFIG = dotenv_values(".env")

app = FastAPI(root_path="/api")
app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data = load_data()
knowledge_prompt = data["prompt"]
location_dict, air_quality, sea_water_quality, system_prompt = (
    data["location_dict"],
    data["air_quality"],
    data["sea_water_quality"],
    data["prompt"],
)

ollama_client = ollama.Client(host=CONFIG.get("OLLAMA_HOST"))


def query_air_quality_data(sql_query: str) -> str:
    """
    Execute a SQL query on the air quality data using pandasql.

    Most likely, the user will ask for a fuzzy location name, try to make queries for all locations (or using regexes/ilikes) and then decide best on your logic.
    E.g when user wants results for "Ampelokipi - Menemeni Municipality", the user might ask for "Ampelokipi" or "Menemeni".

    The air quality data is stored in the variable `air_quality`.
    The columns of the table include:
    - date, co, no, no2, so2, o3, year, location, air_quality_index

    Example usage:
    query_air_quality_data("SELECT * FROM air_quality WHERE location = 'Ampelokipi - Menemeni Municipality'")

    Args:
        sql_query (str): The SQL query to run on the air quality data.
    Returns:
        str: The result of the query as a string (table format).
    """
    print("Executing SQL query:", sql_query)
    try:
        local_vars = {"air_quality": air_quality.copy()}
        result_df = sqldf(sql_query, local_vars)
        print("Result of SQL Query", result_df)
        return (
            result_df.to_string(index=False)
            if not result_df.empty
            else "No data found."
        )
    except Exception as e:
        print("Error executing SQL query:", e)
        return f"Error executing SQL query: {e}"


def sea_water_quality_data(sql_query: str) -> str:
    """
    Execute a SQL query on the sea water quality data using pandasql.

    Most likely, the user will ask for a fuzzy location name, try to make queries for all locations (or using regexes/ilikes) and then decide best on your logic.
    E.g when user wants results for "Thermaikos Port", the user might ask for "Thermaikos" or "Port".

    The sea water quality data is stored in the variable `sea_water_quality`.
    The columns of the table include:
    - year, arsenic, cadmium, copper, dissolved_oxygen, dissolved_oxygen_percentage, lead, nickel, temperature, location, water_quality_index, date

    Example usage:
    sea_water_quality_data("SELECT * FROM sea_water_quality WHERE year = 2020")

    Args:
        sql_query (str): The SQL query to run on the sea water quality data.
    Returns:
        str: The result of the query as a string (table format).
    """

    print("Executing SQL query:", sql_query)
    try:
        local_vars = {"sea_water_quality": sea_water_quality.copy()}
        result_df = sqldf(sql_query, local_vars)
        print("Result of SQL Query", result_df)
        return (
            result_df.to_string(index=False)
            if not result_df.empty
            else "No data found."
        )
    except Exception as e:
        print("Error executing SQL query:", e)
        return f"Error executing SQL query: {e}"


available_tools = {
    "query_air_quality_data": query_air_quality_data,
    "sea_water_quality_data": sea_water_quality_data,
}

MODEL_NAME = "qwen3:8b"
CHAT_OPTIONS = {"temperature": 0}
CHAT_TOOLS = available_tools.values()
system_prompt = (
    query_air_quality_data.__doc__
    + "\n\n"
    + sea_water_quality_data.__doc__
    + "\n\n"
    + system_prompt
)


@app.get("/locations")
def locations() -> list[Location]:
    return location_dict


@app.get(f"/date-range")
def date_range() -> DateRange:
    min_air_quality_date = pd.to_datetime(air_quality["date"].min())
    min_sea_water_quality_date = pd.to_datetime(sea_water_quality["date"].min())
    max_air_quality_date = pd.to_datetime(air_quality["date"].max())
    max_sea_water_quality_date = pd.to_datetime(sea_water_quality["date"].max())

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
    air_quality_story_view = air_quality.copy()
    air_quality_story_view["period"] = air_quality_story_view["date"]

    air_quality_story_view = air_quality_story_view.groupby(
        ["location", "period"], as_index=False
    ).mean(numeric_only=True)

    air_quality_story_view = helpers.rename_air_quality_columns(air_quality_story_view)
    air_quality_story_view = air_quality_story_view.replace(np.nan, None).to_dict(
        orient="records"
    )

    # Water Quality Story View
    sea_water_quality_story_view = sea_water_quality.copy()
    sea_water_quality_story_view["period"] = sea_water_quality_story_view["date"]

    sea_water_quality_story_view = sea_water_quality_story_view.groupby(
        ["location", "period"], as_index=False
    ).mean(numeric_only=True)

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
        sea_water_quality_data_view["date"], format="%Y-%m"
    )
    sea_water_quality_data_view = sea_water_quality_data_view[
        sea_water_quality_data_view["date"].between(
            from_date, to_date, inclusive="both"
        )
    ]
    water_quality_filtered = sea_water_quality_data_view.copy()

    # If there are no records in the date range, return an empty DataFrame
    sea_water_quality_data_view = (
        pd.DataFrame()
        if sea_water_quality_data_view.shape[0] == 0
        else pd.DataFrame([sea_water_quality_data_view.mean(numeric_only=True)])
    )
    sea_water_quality_data_view["location"] = sea_water_quality["location"][0]

    sea_water_quality_data_view = helpers.rename_sea_water_quality_columns(
        sea_water_quality_data_view
    )

    sea_water_quality_data_view = sea_water_quality_data_view.replace(
        np.nan, None
    ).to_dict(orient="records")

    # Air Quality History (monthly)
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

    # Water Quality History (yearly, like the original data)
    sea_water_yearly_avg = (
        water_quality_filtered.groupby("year")["water_quality_index"]
        .mean()
        .reset_index()
    )
    sea_water_quality_sorted = sea_water_yearly_avg.sort_values("year")
    labels = sea_water_quality_sorted["year"].astype(str).tolist()
    values = sea_water_quality_sorted["water_quality_index"].tolist()

    water_quality_history = {
        "labels": labels,
        "lines": [
            {
                "location": water_quality_filtered["location"].iloc[0],
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


@app.post("/chat")
def chat(messages: MessageList = Body()) -> MessageList:
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    # While the model tries to call tools, we will keep calling them until it returns a final message.
    while True:
        # If the Ollama server is not available, return an error message.
        try:
            response = ollama_client.chat(
                MODEL_NAME,
                messages=full_messages,
                tools=CHAT_TOOLS,
                options=CHAT_OPTIONS,
            )
        except ConnectionError:
            return messages + [
                {
                    "role": "assistant",
                    "content": "The assistant is currently unavailable. Please try again later.",
                }
            ]

        tool_calls = getattr(response.message, "tool_calls", None)

        if not tool_calls:
            return messages + [
                {
                    "role": "assistant",
                    "content": response.message.content,
                }
            ]

        for tool in tool_calls:
            function_to_call = available_tools.get(tool.function.name)
            if function_to_call:
                tool_output = function_to_call(**tool.function.arguments)
                full_messages.append(
                    {
                        "role": "assistant",
                        "tool_calls": [tool],
                    }
                )
                full_messages.append(
                    {
                        "role": "tool",
                        "arguments": tool.function.arguments,
                        "name": tool.function.name,
                        "content": str(tool_output),
                    }
                )
