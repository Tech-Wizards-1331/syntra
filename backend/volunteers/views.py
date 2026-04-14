from django.shortcuts import render

from accounts.decorators import role_required


@role_required('volunteer')
def home(request):
	return render(request, 'volunteers/home.html')
