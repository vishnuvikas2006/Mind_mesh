from datetime import datetime
import re
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


RoleChoice = Literal["victim", "trusted_person", "admin"]
TrustedPermission = Literal["wellbeing_score", "wellbeing_status", "daily_checkins", "emergency_alerts", "help_requests", "alert_history", "live_location", "voice_notes"]


def validate_password(value: str) -> str:
    return value


class RegisterInput(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    username: str | None = Field(default=None, min_length=3, max_length=40)
    email: EmailStr
    mobile: str | None = Field(default=None, min_length=7, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    consent: bool

    @field_validator("password")
    @classmethod
    def password_is_strong(cls, value: str) -> str:
        return validate_password(value)

    @field_validator("username")
    @classmethod
    def normalise_username(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip().lower()
        if not re.fullmatch(r"[a-z0-9._-]{3,40}", cleaned):
            raise ValueError("Username may use letters, numbers, dots, underscores, and hyphens only.")
        return cleaned

    @field_validator("mobile")
    @classmethod
    def normalise_mobile(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        cleaned = "".join(character for character in value if character.isdigit() or character == "+")
        if not cleaned or ("+" in cleaned[1:]) or len(cleaned.lstrip("+")) < 7:
            raise ValueError("Please enter a valid mobile number.")
        return cleaned


class LoginInput(BaseModel):
    identifier: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=1, max_length=128)
    expected_role: RoleChoice


class ChangePasswordInput(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def new_password_is_strong(cls, value: str) -> str:
        return validate_password(value)


class PasswordResetRequestInput(BaseModel):
    identifier: str = Field(min_length=3, max_length=120)


class PasswordResetConfirmInput(BaseModel):
    token: str = Field(min_length=20, max_length=256)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def reset_password_is_strong(cls, value: str) -> str:
        return validate_password(value)


class TrustedPersonCreateInput(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    mobile: str | None = Field(default=None, min_length=7, max_length=20)
    relationship: str = Field(default="Trusted person", min_length=2, max_length=60)
    temporary_password: str = Field(min_length=8, max_length=128)
    confirm_temporary_password: str = Field(min_length=8, max_length=128)
    permissions: set[TrustedPermission] = Field(default_factory=lambda: {"emergency_alerts", "help_requests"})

    @field_validator("mobile")
    @classmethod
    def trusted_mobile_is_valid(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        cleaned = "".join(character for character in value if character.isdigit() or character == "+")
        if not cleaned or ("+" in cleaned[1:]) or len(cleaned.lstrip("+")) < 7:
            raise ValueError("Please enter a valid mobile number.")
        return cleaned

    @field_validator("temporary_password")
    @classmethod
    def temporary_password_is_strong(cls, value: str) -> str:
        return validate_password(value)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.temporary_password != self.confirm_temporary_password:
            raise ValueError("Temporary passwords do not match.")
        return self


class TrustedPersonUpdateInput(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=80)
    email: EmailStr | None = None
    mobile: str | None = Field(default=None, min_length=7, max_length=20)
    relationship: str | None = Field(default=None, min_length=2, max_length=60)
    permissions: set[TrustedPermission] | None = None
    enabled: bool | None = None

    @field_validator("mobile")
    @classmethod
    def updated_mobile_is_valid(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = "".join(character for character in value if character.isdigit() or character == "+")
        if not cleaned or ("+" in cleaned[1:]) or len(cleaned.lstrip("+")) < 7:
            raise ValueError("Please enter a valid mobile number.")
        return cleaned


class LocationShareInput(BaseModel):
    trusted_person_id: str = Field(min_length=8, max_length=80)
    duration_minutes: Literal[15, 30, 60, 240, 0]


class TextInteractionInput(BaseModel):
    text: str = Field(min_length=1, max_length=3000)
    mood: Literal["okay", "stressed", "scared", "need_help"] | None = None
    channel: Literal["check_in", "chat", "sms", "web"] = "check_in"


class ReviewAlertInput(BaseModel):
    decision: Literal["contact_victim", "assign_counselling", "assign_medical", "assign_legal", "close"]
    note: str = Field(default="", max_length=1000)


class SupportActionInput(BaseModel):
    action_type: Literal["counselling", "medical", "legal", "rehabilitation", "follow_up"]
    note: str = Field(default="", max_length=1000)
    scheduled_for: datetime | None = None


class SupportSessionInput(BaseModel):
    support_type: Literal["Counselling session", "Legal support", "Medical support", "Follow-up check-in"]
    scheduled_for: datetime


class DeleteVictimInput(BaseModel):
    """Explicit, deliberate confirmation for irreversible admin account removal."""

    confirmation: Literal["DELETE"]


class LocationUpdateInput(BaseModel):
    """A coarsened, user-initiated location. Continuous tracking is not supported."""

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy_meters: float | None = Field(default=None, ge=0, le=50_000)


class VoiceMoodInput(BaseModel):
    mood: Literal["okay", "stressed", "scared", "need_help"] | None = None


class RealtimeVoiceSessionInput(BaseModel):
    """Browser WebRTC offer for a short-lived Sahaaya AI voice connection."""

    sdp: str = Field(min_length=20, max_length=100_000)
    language: Literal["auto", "te", "hi", "en", "ta", "kn", "ml", "bn"] = "auto"
    spiritual_support: Literal["off", "reflection", "tradition"] = "off"
    spiritual_tradition: str | None = Field(default=None, max_length=80)

    @field_validator("spiritual_tradition")
    @classmethod
    def normalise_spiritual_tradition(cls, value: str | None) -> str | None:
        return value.strip() if value and value.strip() else None


class VoiceHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=1200)


class LocalVoiceTurnInput(BaseModel):
    """One privacy-preserving local model voice turn (browser supplies text)."""

    text: str = Field(min_length=1, max_length=1200)
    language: Literal["auto", "te", "hi", "en", "ta", "kn", "ml", "bn"] = "auto"
    history: list[VoiceHistoryItem] = Field(default_factory=list, max_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
