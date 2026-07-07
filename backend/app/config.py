from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    open_model_api_key: str = ""
    hf_token: str = ""
    huggingface_api_key: str = ""
    open_model_base_url: str = "https://router.huggingface.co/v1"
    open_model_name: str = "Qwen/Qwen2.5-7B-Instruct-1M:fastest"
    open_model_max_tokens: int = 350
    open_model_temperature: float = 0.7
    open_model_timeout_seconds: float = 30.0
    open_model_include_transcript: bool = False
    open_model_allow_anonymous: bool = True
    anonymous_open_model_base_url: str = "https://text.pollinations.ai"
    anonymous_open_model_name: str = "openai-fast"
    anonymous_open_model_api_key: str = ""
    free_tier_cap: int = 5
    cors_origins: str = "*"

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def open_model_token(self) -> str:
        return self.open_model_api_key or self.hf_token or self.huggingface_api_key


settings = Settings()
