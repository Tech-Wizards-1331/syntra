from django.shortcuts import redirect
from django.urls import reverse

class UserFlowMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        # ✅ Admin routes completely skip
        if request.path.startswith('/admin'):
            return self.get_response(request)

        if request.path.startswith('/accounts/social/'):
            return self.get_response(request)

        # ✅ Only for logged-in users
        if request.user.is_authenticated:

            # ✅ Superuser ne ignore karo
            if request.user.is_superuser:
                return self.get_response(request)

            role_url = reverse('select_role')
            complete_profile_url = reverse('complete_profile')
            allowed_paths = {
                role_url,
                complete_profile_url,
                reverse('logout'),
                reverse('social_login_redirect'),
            }

            # 🔹 Role selection check
            if not request.user.role:
                if request.path not in allowed_paths:
                    return redirect('select_role')

            # 🔹 Profile completion check (only after role exists)
            if request.user.role and not getattr(request.user, 'is_profile_complete', False):
                if request.path not in allowed_paths:
                    return redirect('complete_profile')

        return self.get_response(request)