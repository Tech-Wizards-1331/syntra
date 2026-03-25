from functools import wraps

from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden


def role_required(*allowed_roles):
    def decorator(view_func):
        @login_required
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            user_role = getattr(request.user, 'role', None)
            if request.user.is_superuser or user_role in allowed_roles:
                return view_func(request, *args, **kwargs)
            return HttpResponseForbidden('You are not allowed to access this page.')

        return _wrapped_view

    return decorator
