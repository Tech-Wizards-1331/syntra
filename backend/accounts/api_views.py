from django.contrib.auth import login
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .api_serializers import LoginSerializer, RegisterSerializer


class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        response = Response(
            {
                'message': 'Registration successful.',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'role': user.role,
                    'is_profile_complete': user.is_profile_complete,
                },
            },
            status=status.HTTP_201_CREATED,
        )
        from django.conf import settings
        response.set_cookie('access', access_token, samesite='Lax', secure=not settings.DEBUG, httponly=True)
        response.set_cookie('refresh', refresh_token, samesite='Lax', secure=not settings.DEBUG, httponly=True)
        return response


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        refresh = RefreshToken.for_user(user)

        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        response = Response(
            {
                'message': 'Login successful.',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'role': user.role,
                    'is_profile_complete': user.is_profile_complete,
                },
            },
            status=status.HTTP_200_OK,
        )
        from django.conf import settings
        response.set_cookie('access', access_token, samesite='Lax', secure=not settings.DEBUG, httponly=True)
        response.set_cookie('refresh', refresh_token, samesite='Lax', secure=not settings.DEBUG, httponly=True)
        return response


class MeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'is_profile_complete': user.is_profile_complete,
            },
            status=status.HTTP_200_OK,
        )

from rest_framework_simplejwt.views import TokenRefreshView

class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Allow requests to be immutable QueryDict by copying or handling manually
        request._full_data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        refresh_token = request.COOKIES.get('refresh')
        if refresh_token and 'refresh' not in request._full_data:
            request._full_data['refresh'] = refresh_token
            request._request.POST = request._full_data

        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            if access_token:
                from django.conf import settings
                response.set_cookie(
                    'access',
                    access_token,
                    samesite='Lax',
                    secure=not settings.DEBUG,
                    httponly=True,
                )
            new_refresh_token = response.data.get('refresh')
            if new_refresh_token:
                from django.conf import settings
                response.set_cookie(
                    'refresh',
                    new_refresh_token,
                    samesite='Lax',
                    secure=not settings.DEBUG,
                    httponly=True,
                )
            response.data.pop('access', None)
            response.data.pop('refresh', None)
        return response

class CookieLogoutView(APIView):
    def post(self, request, *args, **kwargs):
        response = Response({"detail": "Successfully logged out."})
        response.delete_cookie('access')
        response.delete_cookie('refresh')
        return response
