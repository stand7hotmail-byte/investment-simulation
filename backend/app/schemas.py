from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class PortfolioBase(BaseModel):
    name: str
    description: str | None = None

class PortfolioCreate(PortfolioBase):
    pass

class Portfolio(PortfolioBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_current: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
