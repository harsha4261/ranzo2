from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "ranzo"
    REDIS_URL: str = "redis://localhost:6379"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    # OTP lives 60 seconds before it expires
    OTP_TTL_SECONDS: int = 60
    # After OTP is verified, the user has this many seconds to complete registration
    OTP_VERIFICATION_WINDOW_SECONDS: int = 300

    # Comma-separated list of origins allowed to make credentialed requests
    # (admin panel, mobile app dev tunnels). "*" is intentionally not supported
    # here because it is incompatible with allow_credentials=True.
    ALLOWED_ORIGINS: str = "http://localhost:3001,http://localhost:8081,http://localhost:19006"

    # Razorpay — wallet recharge is disabled (503) until both of these are set.
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def razorpay_configured(self) -> bool:
        return bool(self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_SECRET)


settings = Settings()
