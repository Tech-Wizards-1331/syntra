from django.shortcuts import render

from accounts.decorators import role_required


@role_required('super_admin')
def home(request):
	return render(request, 'super_admin/home.html')
