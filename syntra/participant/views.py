from django.shortcuts import render

from accounts.decorators import role_required


@role_required('participant')
def home(request):
	return render(request, 'participant/home.html')
