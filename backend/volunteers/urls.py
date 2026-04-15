from django.urls import path
from . import views

urlpatterns = [
	path('', views.home, name='volunteers_home'),
	path('dashboard', views.home, name='volunteers_dashboard'),
]
