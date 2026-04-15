from django.http import JsonResponse


def hello_api(request):
    return JsonResponse({'message': 'API is working'})
