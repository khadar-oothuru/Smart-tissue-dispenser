from django.shortcuts import render

def home(request):
    """
    Home page view for Smart Dispenser
    """
    return render(request, 'core/home.html')
