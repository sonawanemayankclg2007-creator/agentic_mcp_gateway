import asyncio
import functools
from app.utils.logger import get_logger

logger = get_logger("retry")


def retry(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """
    Async decorator with exponential backoff.
    delay grows as: delay * (backoff ** attempt_index)
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            current_delay = delay
            last_exc: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as exc:
                    last_exc = exc
                    logger.warning(
                        f"Retry attempt {attempt + 1}/{max_attempts} for {func.__name__}",
                        extra={"error": str(exc), "attempt": attempt + 1},
                    )
                    if attempt < max_attempts - 1:
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff
            raise last_exc
        return wrapper
    return decorator
