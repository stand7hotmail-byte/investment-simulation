import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine the base directory of the backend application
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, "test.db")

class Settings(BaseSettings):
    database_url: str = f"sqlite:///{DATABASE_PATH}"
    
    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url
    
    # Allow DATABASE_URL from environment to override default
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
