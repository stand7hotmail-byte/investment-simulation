import os
from pydantic_settings import BaseSettings

# Determine the base directory of the backend application
# This assumes config.py is in backend/app/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, "test.db")

class Settings(BaseSettings):
    database_url: str = f"sqlite:///{DATABASE_PATH}"

settings = Settings()
