from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


Plan = Literal["free", "pro"]


class BillingStatus(BaseModel):
    plan: Plan
    status: str
    is_pro: bool
    free_conversations_remaining: int
    current_period_end: datetime | None = None
    trial_end: datetime | None = None
    cancel_at_period_end: bool = False
    stripe_configured: bool
    checkout_available: bool
    portal_available: bool

    model_config = ConfigDict(extra="ignore")


class BillingSessionResponse(BaseModel):
    url: str


class StripeWebhookResponse(BaseModel):
    received: bool = True
