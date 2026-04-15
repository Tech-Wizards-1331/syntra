from django.urls import path
from . import views

urlpatterns = [
	path('', views.home, name='judge_home'),
	path('dashboard', views.home, name='judge_dashboard'),
]
