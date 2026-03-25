from django.urls import path
from . import views

urlpatterns = [
	path('', views.home, name='organizer_home'),
	path('dashboard', views.home, name='organizer_dashboard'),
]
