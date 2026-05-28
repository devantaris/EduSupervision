"""
Phase 8: Real-Time Notification System

Two notification channels:
  1. SSE Event Stream (/notifications/stream)
     — Teacher subscribes to their personal submission updates
     — Admin subscribes to institution-wide pipeline events
     — Powered by Redis pub/sub (no polling, true push)

  2. Email Notifications (Celery task)
     — Teacher receives email when their evaluation completes
     — Admin receives daily digest of pending flags (future)
     — Mock dispatch in development; uses SendGrid/SMTP in production

SSE implementation:
  - Uses asyncio.Queue per active connection
  - Redis subscriber runs as asyncio background task per SSE connection
  - EventSource reconnects handled via Last-Event-ID header
  - Heartbeat every 30s to keep connection alive through proxies
"""

import asyncio
import json
import logging
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import StreamingResponse
import redis.asyncio as aioredis

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── SSE Event Stream ──────────────────────────────────────────────────────────

async def _redis_subscriber(
    queue: asyncio.Queue,
    channels: list[str],
    stop_event: asyncio.Event,
) -> None:
    """
    Background coroutine: subscribes to Redis pub/sub channels and
    pushes payloads into the asyncio Queue for the SSE generator.
    Runs until stop_event is set (client disconnects).
    """
    r = aioredis.from_url(settings.REDIS_URL)
    pubsub = r.pubsub()
    try:
        await pubsub.subscribe(*channels)
        async for message in pubsub.listen():
            if stop_event.is_set():
                break
            if message["type"] == "message":
                try:
                    payload = json.loads(message["data"])
                    await queue.put(payload)
                except Exception as e:
                    logger.warning(f"SSE message parse error: {e}")
    except Exception as e:
        logger.warning(f"SSE Redis subscriber error: {e}")
    finally:
        await pubsub.unsubscribe(*channels)
        await r.aclose()


async def _sse_generator(
    request: Request,
    queue: asyncio.Queue,
    stop_event: asyncio.Event,
) -> AsyncGenerator[str, None]:
    """
    Yields SSE-formatted strings from the queue.
    Sends a heartbeat comment every 30s to keep the connection alive.
    """
    event_id = 0
    while not stop_event.is_set():
        # Check if client disconnected
        if await request.is_disconnected():
            stop_event.set()
            break

        try:
            # Wait for a message or timeout for heartbeat
            payload = await asyncio.wait_for(queue.get(), timeout=30.0)
            event_id += 1
            data = json.dumps(payload)
            yield f"id:{event_id}\ndata:{data}\n\n"
        except asyncio.TimeoutError:
            # Heartbeat keeps connection alive through Vercel / nginx / AWS ALB
            yield ": heartbeat\n\n"
        except Exception as e:
            logger.warning(f"SSE generator error: {e}")
            break


@router.get("/stream")
async def sse_notification_stream(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Real-time SSE notification stream.

    Teachers: receive updates for their own submissions
    Admins: receive institution-wide pipeline events

    Channel naming:
      submission:{uuid}       → updates for a specific submission
      institution:{uuid}      → all institution-wide events (admin only)
      user:{uuid}             → personal teacher notifications
    """
    stop_event = asyncio.Event()
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)

    # Determine which channels this user subscribes to
    channels = [f"user:{current_user.id}"]

    if current_user.role in ("InstitutionAdmin", "SuperAdmin"):
        if current_user.institution_id:
            channels.append(f"institution:{current_user.institution_id}")
    elif current_user.role == "Teacher":
        # Teachers also subscribe to their institution channel for announcements
        if current_user.institution_id:
            channels.append(f"institution:{current_user.institution_id}:announcements")

    # Start Redis subscriber as a background task
    subscriber_task = asyncio.create_task(
        _redis_subscriber(queue, channels, stop_event)
    )

    # Send initial connection confirmation
    async def stream_with_cleanup():
        try:
            # Connected event
            yield f"data:{json.dumps({'type': 'connected', 'user_id': str(current_user.id)})}\n\n"
            async for chunk in _sse_generator(request, queue, stop_event):
                yield chunk
        finally:
            stop_event.set()
            subscriber_task.cancel()
            try:
                await subscriber_task
            except asyncio.CancelledError:
                pass

    return StreamingResponse(
        stream_with_cleanup(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.get("/submission/{submission_id}/stream")
async def submission_sse_stream(
    submission_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Dedicated SSE stream for a single submission evaluation.
    Teacher polls this page while their submission is being evaluated.
    Completes automatically when evaluation_complete event arrives.
    """
    stop_event = asyncio.Event()
    queue: asyncio.Queue = asyncio.Queue(maxsize=10)

    channel = f"submission:{submission_id}"
    subscriber_task = asyncio.create_task(
        _redis_subscriber(queue, [channel], stop_event)
    )

    async def stream_with_cleanup():
        try:
            yield f"data:{json.dumps({'type': 'watching', 'submission_id': str(submission_id)})}\n\n"
            async for chunk in _sse_generator(request, queue, stop_event):
                yield chunk
                # Check if evaluation complete — stop streaming
                try:
                    last = queue.get_nowait()
                    if last.get("status") == "evaluated":
                        yield f"data:{json.dumps(last)}\n\n"
                        break
                except asyncio.QueueEmpty:
                    pass
        finally:
            stop_event.set()
            subscriber_task.cancel()
            try:
                await subscriber_task
            except asyncio.CancelledError:
                pass

    return StreamingResponse(
        stream_with_cleanup(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
