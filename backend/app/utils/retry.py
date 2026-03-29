import asyncio
import functools

def retry_async(retries=3, delay=1):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt < retries - 1:
                        await asyncio.sleep(delay)
                    else:
                        raise e
        return wrapper
    return decorator
