import os
from dotenv import load_dotenv

load_dotenv()

APP_TITLE = "MediQueue API"
APP_VERSION = "0.1.0"
DEFAULT_ROOM_NO = "101"
DEFAULT_WAIT_MINUTES = 6

# DeepSeek LLM Configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

# TTS Configuration
TTS_PROVIDER = os.getenv("TTS_PROVIDER", "mock")
TTS_ENABLED = os.getenv("TTS_ENABLED", "true").lower() == "true"
