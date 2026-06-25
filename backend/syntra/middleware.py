"""
syntra/middleware.py — Performance & observability middleware.

RequestTimingMiddleware
    Logs any request that takes longer than SLOW_REQUEST_THRESHOLD_MS (default 500ms).
    Output format (single line, machine-parseable):
        SLOW [GET /api/organizer/problem-statements/] 832ms  user=ansh@example.com
    Set LOG_SLOW_REQUESTS=false in .env to disable without redeploying.
"""
from __future__ import annotations

import logging
import os
import time

logger = logging.getLogger('syntra.perf')

# Threshold in milliseconds — configurable via env without code changes
_THRESHOLD_MS = int(os.getenv('SLOW_REQUEST_THRESHOLD_MS', '500'))
_ENABLED = os.getenv('LOG_SLOW_REQUESTS', 'true').lower() not in ('false', '0', 'no')


class RequestTimingMiddleware:
    """
    Measures wall-clock time for every request.
    Logs a WARNING for any request exceeding SLOW_REQUEST_THRESHOLD_MS.
    Zero overhead on fast requests (no log I/O).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not _ENABLED:
            return self.get_response(request)

        t0 = time.perf_counter()
        response = self.get_response(request)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        if elapsed_ms >= _THRESHOLD_MS:
            user = (
                request.user.email
                if getattr(request, 'user', None) and request.user.is_authenticated
                else 'anonymous'
            )
            logger.warning(
                'SLOW [%s %s] %.0fms  user=%s  status=%s',
                request.method,
                request.path,
                elapsed_ms,
                user,
                response.status_code,
            )

        return response
