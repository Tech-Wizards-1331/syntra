"""
URL configuration for syntra project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.views.generic import TemplateView
from django.urls import include, path
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model

def profile_complete_view(request):
    if request.method == 'POST':
        data = request.POST
        user = request.user
        user.first_name = data.get('full_name', '').split(' ')[0]
        user.last_name = ' '.join(data.get('full_name', '').split(' ')[1:])
        user.save()
        # Store extra fields in session until you have a Profile model
        request.session['profile_role']         = data.get('role', '')
        request.session['profile_phone']        = data.get('phone', '')
        request.session['profile_organisation'] = data.get('organisation', '')
        request.session['profile_github']       = data.get('github_url', '')
        request.session['profile_experience']   = data.get('experience_level', '')
        request.session['profile_skills']       = data.get('skills', '')
        request.session['profile_complete']     = True
        return redirect('home')
    return render(request, 'profile_complete.html')

urlpatterns = [
    # path('', include('super_admin.urls')),
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('super_admin/', include('super_admin.urls')),
    path('judge/', include('judge.urls')),
    path('organizer/', include('organizer.urls')),
    path('participant/', include('participant.urls')),
    path('volunteers/', include('volunteers.urls')),
    path('', include('core.urls')),
]
