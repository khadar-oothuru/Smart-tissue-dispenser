from django.urls import path
from django.shortcuts import render
from .views import home, send_contact_message, contact_support_web, health_check



urlpatterns = [
    path('', home, name='home'),
    path('api/contact/', send_contact_message, name='contact_support'),
    path('api/health/', health_check, name='health_check'),
    path('contact/', contact_support_web, name='contact_support_web'),
    
]
