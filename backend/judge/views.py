from django.shortcuts import render

from accounts.decorators import role_required


@role_required('judge')
def home(request):
	return render(request, 'judge/home.html')
