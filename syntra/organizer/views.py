from django.shortcuts import render

from accounts.decorators import role_required


@role_required('organizer')
def home(request):
	return render(request, 'organizer/home.html')
