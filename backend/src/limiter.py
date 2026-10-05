"""
Centralized Rate Limiting Configuration for VALENCE Decision Engine
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared SlowAPI Limiter using client IP
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
