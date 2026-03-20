from django.shortcuts import render


def home(request):
	return render(request, 'super_admin/home.html')
