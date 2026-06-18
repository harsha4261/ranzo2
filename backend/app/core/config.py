from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "ranzo"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    # OTP lives 60 seconds before it expires
    OTP_TTL_SECONDS: int = 60
    # After OTP is verified, the user has this many seconds to complete registration
    OTP_VERIFICATION_WINDOW_SECONDS: int = 300


settings = Settings()
