from django.shortcuts import render

from rest_framework_simplejwt.tokens import RefreshToken

from accounts.decorators import role_required


@role_required('organizer')
def home(request):
    refresh = RefreshToken.for_user(request.user)
    context = {
        'jwt_access': str(refresh.access_token),
        'jwt_refresh': str(refresh),
        'user_full_name': request.user.full_name or request.user.email,
    }
    return render(request, 'organizer/home.html', context)
