from fastapi import FastAPI

from .views import router
from .models import create_db_and_tables

app = FastAPI()
app.include_router(router)
app.add_event_handler("startup", create_db_and_tables)
