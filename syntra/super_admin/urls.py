from django.urls import path
from . import views

urlpatterns = [
	path('', views.home, name='super_admin_home'),
	path('dashboard', views.home, name='super_admin_dashboard'),
]
