from django.urls import path
from . import views

urlpatterns = [
	path('', views.home, name='participant_home'),
]
