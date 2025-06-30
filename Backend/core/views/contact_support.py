from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib import messages
from django.shortcuts import render, redirect
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@swagger_auto_schema(
    method='post',
    operation_description="Send contact support message via email",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['name', 'email', 'message'],
        properties={
            'name': openapi.Schema(type=openapi.TYPE_STRING, description='Sender name'),
            'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='Sender email'),
            'phone': openapi.Schema(type=openapi.TYPE_STRING, description='Phone number (optional)'),
            'subject': openapi.Schema(type=openapi.TYPE_STRING, description='Message subject'),
            'message': openapi.Schema(type=openapi.TYPE_STRING, description='Support message')
        }
    ),
    responses={
        200: openapi.Response('Message sent successfully'),
        400: 'Invalid data provided',
        500: 'Email sending failed'
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def send_contact_message(request):
    """
    Send a contact support message via email - API endpoint for mobile app
    """
    try:
        # Extract data from request
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        phone = request.data.get('phone', '').strip()
        subject = request.data.get('subject', 'General Support').strip()
        message = request.data.get('message', '').strip()
        
        # Validate required fields
        if not all([name, email, message]):
            return Response({
                'error': 'Name, email and message are required',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format (basic validation)
        if '@' not in email or '.' not in email:
            return Response({
                'error': 'Please provide a valid email address',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Send email to support team
        support_subject = f"New Support Request: {subject}"
        support_message = f"""
New Support Request from Mobile App

From: {name}
Email: {email}
Phone: {phone if phone else 'Not provided'}
Subject: {subject}

Message:
{message}

---
This message was sent from the Smart Dispenser Mobile App.
        """
        
        try:
            # Send notification to support team
            send_mail(
                subject=support_subject,
                message=support_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[settings.EMAIL_HOST_USER],
                fail_silently=False,
            )            # Send confirmation email to user using HTML template
            try:
                confirmation_html = render_to_string('emails/contact_support_confirmation.html', {
                    'name': name,
                    'email': email,
                    'phone': phone if phone else None,
                    'subject': subject,
                    'message': message,
                    'current_date': datetime.now().strftime('%B %d, %Y'),
                })
                
                # Plain text fallback
                plain_message = f"""Hi {name},

Thank you for contacting Smart Dispenser support! We've successfully received your message and our team will review it shortly.

Your Message Summary:
- Subject: {subject}
- Email: {email}
{f"- Phone: {phone}" if phone else ""}
- Message: {message}

What Happens Next?
• Emergency Issues: You'll hear from us within 2-4 hours
• General Support: We'll respond within 24-48 hours
• Technical Issues: Our technical team will investigate and respond promptly

Need Immediate Assistance?
Email: support@smartdispenser.com
Phone: +1 (555) 123-4567 (Mon-Fri 9AM-6PM EST)

Best regards,
Smart Dispenser Support Team

This is an automated confirmation message.
© 2025 Smart Dispenser. All rights reserved."""
                
                send_mail(
                    subject="Your Support Request Received - Smart Dispenser",
                    message=plain_message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    html_message=confirmation_html,
                    fail_silently=True,
                )
                logger.info(f"Confirmation email sent to {email}")
            except Exception as e:
                logger.error(f"Failed to send confirmation email: {str(e)}")
                # Don't fail the whole request if confirmation email fails
            
            logger.info(f"Contact form submitted successfully by {email}")
            
            return Response({
                'success': True,
                'message': 'Your message has been sent successfully. We\'ll get back to you soon!'
            }, status=status.HTTP_200_OK)
            
        except Exception as email_error:
            logger.error(f"Failed to send contact email: {str(email_error)}")
            return Response({
                'error': 'Failed to send email. Please try again later or contact us directly.',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
        return Response({
            'error': 'An unexpected error occurred. Please try again.',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def contact_support_web(request):
    """
    Web view for contact support form
    """
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        email = request.POST.get('email', '').strip()
        phone = request.POST.get('phone', '').strip()
        subject = request.POST.get('subject', '').strip()
        message = request.POST.get('message', '').strip()

        # Create context with form data for template
        context = {
            'form_data': {
                'name': name,
                'email': email,
                'phone': phone,
                'subject': subject,
                'message': message,
            }
        }

        # Validation
        if not all([name, email, subject, message]):
            messages.error(request, 'Name, email, subject and message are required.')
            return render(request, 'core/contact_support.html', context)        # Validate email format
        if '@' not in email or '.' not in email:
            messages.error(request, 'Please provide a valid email address.')
            return render(request, 'core/contact_support.html', context)

        try:
            # Send email to support team
            support_subject = f"New Support Request: {subject}"
            support_message = f"""
New Support Request from Website

From: {name}
Email: {email}
Phone: {phone if phone else 'Not provided'}
Subject: {subject}

Message:
{message}

---
This message was sent from the Smart Dispenser Website Contact Form.
            """

            # Send notification to support team
            send_mail(
                subject=support_subject,
                message=support_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[settings.EMAIL_HOST_USER],
                fail_silently=False,
            )            # Send confirmation email to user
            try:
                confirmation_html = render_to_string('emails/contact_support_confirmation.html', {
                    'name': name,
                    'email': email,
                    'phone': phone if phone else None,
                    'subject': subject,
                    'message': message,
                    'current_date': datetime.now().strftime('%B %d, %Y'),
                })
                
                # Plain text fallback for better email compatibility
                plain_message = f"""Hi {name},

Thank you for contacting Smart Dispenser support! We've successfully received your message and our team will review it shortly.

Your Message Summary:
- Subject: {subject}
- Email: {email}
{f"- Phone: {phone}" if phone else ""}
- Message: {message}

What Happens Next?
• Emergency Issues: You'll hear from us within 2-4 hours
• General Support: We'll respond within 24-48 hours
• Technical Issues: Our technical team will investigate and respond promptly

Need Immediate Assistance?
Email: support@smartdispenser.com
Phone: +1 (555) 123-4567 (Mon-Fri 9AM-6PM EST)

Best regards,
Smart Dispenser Support Team

This is an automated confirmation message.
© 2025 Smart Dispenser. All rights reserved."""
                
                send_mail(
                    subject="Your Support Request Received - Smart Dispenser",
                    message=plain_message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    html_message=confirmation_html,
                    fail_silently=True,
                )
                logger.info(f"Web confirmation email sent to {email}")
            except Exception as e:
                logger.error(f"Failed to send web confirmation email: {str(e)}")
                # Don't fail the whole request if confirmation email fails

            messages.success(request, 'Your message has been sent successfully! We\'ll get back to you soon.')
            return redirect('contact_support_web')

        except Exception as e:
            logger.error(f"Contact support web error: {str(e)}")
            messages.error(request, 'An error occurred while sending your message. Please try again.')
            return render(request, 'core/contact_support.html', context)

    return render(request, 'core/contact_support.html')


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Simple health check endpoint for connectivity testing
    """
    return Response({
        'status': 'healthy',
        'message': 'Server is running',
        'timestamp': datetime.now().isoformat()
    }, status=status.HTTP_200_OK)
