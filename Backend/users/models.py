from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import random
import string
from django.core.validators import RegexValidator
import uuid

def default_profile_image():
    return 'https://media.istockphoto.com/id/2212478710/vector/faceless-male-avatar-in-hoodie-illustration.jpg?s=612x612&w=0&k=20&c=Wlwpp5BUnzbzXxaCT0a7WqP_JvknA-JtOhBoKDpQMHE='

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )

    # Override fields
    username = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    profile_picture = models.URLField(blank=True, null=True, default=default_profile_image)

    # OTP Fields
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True, db_index=True)
    otp_verified = models.BooleanField(default=False)

    # Set email as the login field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def generate_otp(self):
        """Generate a 6-digit numeric OTP and save with timestamp"""
        self.otp_code = ''.join(random.choices(string.digits, k=6))
        self.otp_created_at = timezone.now()
        self.otp_verified = False
        self.save()
        return self.otp_code
    


    def verify_otp(self, otp):
    
        if not self.otp_code or not self.otp_created_at:
            return False

        expiry_time = self.otp_created_at + timedelta(minutes=10)
        if timezone.now() > expiry_time:
            return False

        if self.otp_code == otp:
        # Set otp_verified to True when OTP matches
            self.otp_verified = True
            self.save()
            return True

        return False

    # def verify_otp(self, otp):
    #     """
    #     Verify the provided OTP:
    #     - Must match the stored OTP
    #     - Must not be expired (10-minute validity)
    #     """
    #     if not self.otp_code or not self.otp_created_at:
    #         return False

    #     expiry_time = self.otp_created_at + timedelta(minutes=10)
    #     if timezone.now() > expiry_time:
    #         return False

    #     if self.otp_code == otp:
    #         return True

    #     return False

    

    def clear_otp(self):
        """Clear OTP data after successful use"""
        self.otp_code = None
        self.otp_created_at = None
        self.otp_verified = False
        self.save()

    def is_otp_valid(self):
        """Check if the current OTP is still valid (within 10 minutes)"""
        if not self.otp_created_at:
            return False
        return timezone.now() <= self.otp_created_at + timedelta(minutes=10)

    def __str__(self):
        return f"{self.email} - Role: {self.role}"

class AppLog(models.Model):
    """Model to store application logs for admin monitoring"""
    
    LOG_LEVELS = [
        ('INFO', 'Info'),
        ('SUCCESS', 'Success'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('DEBUG', 'Debug'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=10, choices=LOG_LEVELS, default='INFO')
    message = models.CharField(max_length=255)
    source = models.CharField(max_length=50, default='System')
    details = models.TextField(blank=True, null=True)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['level']),
            models.Index(fields=['source']),
        ]
    
    def __str__(self):
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')} - {self.level} - {self.message}"
    
    @classmethod
    def log_info(cls, message, source='System', details=None, user=None, request=None):
        """Log an info message"""
        return cls._create_log('INFO', message, source, details, user, request)
    
    @classmethod
    def log_success(cls, message, source='System', details=None, user=None, request=None):
        """Log a success message"""
        return cls._create_log('SUCCESS', message, source, details, user, request)
    
    @classmethod
    def log_warning(cls, message, source='System', details=None, user=None, request=None):
        """Log a warning message"""
        return cls._create_log('WARNING', message, source, details, user, request)
    
    @classmethod
    def log_error(cls, message, source='System', details=None, user=None, request=None):
        """Log an error message"""
        return cls._create_log('ERROR', message, source, details, user, request)
    
    @classmethod
    def log_debug(cls, message, source='System', details=None, user=None, request=None):
        """Log a debug message"""
        return cls._create_log('DEBUG', message, source, details, user, request)
    
    @classmethod
    def _create_log(cls, level, message, source, details, user, request):
        """Create a log entry with optional request information"""
        log_data = {
            'level': level,
            'message': message,
            'source': source,
            'details': details,
            'user': user,
        }
        
        # Add request information if available
        if request:
            log_data['ip_address'] = cls._get_client_ip(request)
            log_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        
        return cls.objects.create(**log_data)
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip