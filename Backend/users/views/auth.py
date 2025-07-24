import os
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import cloudinary
import cloudinary.uploader


from ..models import CustomUser, AppLog
from ..serializers import (
    RegisterSerializer, 
    UserSerializer, 
    CustomTokenObtainPairSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    ProfilePictureSerializer
)

User = get_user_model()


cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
)

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Register a new user",
        request_body=RegisterSerializer,
        responses={201: RegisterSerializer, 400: 'Validation Error'}
    )
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 201:
                user_email = response.data.get('email') or request.data.get('email')
                AppLog.log_success(
                    message="User registered successfully",
                    source="RegisterView",
                    details=f"User: {user_email}",
                    request=request
                )
            return response
        except Exception as e:
            AppLog.log_error(
                message="User registration failed",
                source="RegisterView",
                details=str(e),
                request=request
            )
            raise

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get details of authenticated user",
        responses={200: UserSerializer()}
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Update user profile",
        request_body=UserUpdateSerializer,
        responses={200: UserSerializer}
    )
    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken.for_user(request.user)
                AppLog.log_success(
                    message="User profile updated",
                    source="UserUpdateView",
                    details=f"User: {request.user.email}",
                    user=request.user,
                    request=request
                )
                return Response({
                    'user': UserSerializer(request.user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                })
            except Exception as e:
                AppLog.log_error(
                    message="User profile update failed",
                    source="UserUpdateView",
                    details=str(e),
                    user=request.user,
                    request=request
                )
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UploadProfilePictureView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    @swagger_auto_schema(
        operation_description="Upload profile picture",
        manual_parameters=[
            openapi.Parameter(
                'image',
                openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description='Profile picture image file'
            )
        ],
        responses={200: 'Image uploaded successfully'}
    )
    def post(self, request):
        serializer = ProfilePictureSerializer(data=request.data)
        if serializer.is_valid():
            image = serializer.validated_data['image']
            
            try:
                result = cloudinary.uploader.upload(
                    image,
                    folder="profile_pictures",
                    transformation=[
                        {'width': 300, 'height': 300, 'crop': 'fill'},
                        {'quality': 'auto'}
                    ]
                )
                
                request.user.profile_picture = result['secure_url']
                request.user.save()
                
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken.for_user(request.user)
                
                
                AppLog.log_success(
                    message="Profile picture uploaded successfully",
                    source="UploadProfilePictureView",
                    details=f"User: {request.user.email}",
                    user=request.user,
                    request=request
                )
                
                return Response({
                    'message': 'Profile picture uploaded successfully',
                    'profile_picture': result['secure_url'],
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                })
            except Exception as e:
                
                AppLog.log_error(
                    message="Profile picture upload failed",
                    source="UploadProfilePictureView",
                    details=f"User: {request.user.email}, Error: {str(e)}",
                    user=request.user,
                    request=request
                )
                return Response(
                    {'error': f'Failed to upload image: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string

class SendChangePasswordOTPView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Send OTP for password change",
        responses={200: 'OTP sent successfully'}
    )
    def post(self, request):
        try:
            # Generate OTP
            otp = request.user.generate_otp()

            # Email content
            subject = 'Password Change OTP'
            from_email = settings.DEFAULT_FROM_EMAIL
            to_email = request.user.email

            # Load HTML content using Django template engine
            html_content = render_to_string('emails/otp_email.html', {
                'user': request.user,
                'otp': otp
            })
            text_content = f'Your OTP for password change is: {otp}\n\nThis OTP will expire in 10 minutes.'

            # Compose email
            email = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
            email.attach_alternative(html_content, "text/html")
            email.send()

            # Log OTP sent for password change
            AppLog.log_info(
                message="Password change OTP sent",
                source="SendChangePasswordOTPView",
                details=f"User: {request.user.email}",
                user=request.user,
                request=request
            )

            return Response({
                'message': 'OTP sent to your email',
                'email': to_email
            })

        except Exception as e:
            # Log failed OTP sending
            AppLog.log_error(
                message="Failed to send password change OTP",
                source="SendChangePasswordOTPView",
                details=f"User: {request.user.email}, Error: {str(e)}",
                user=request.user,
                request=request
            )
            return Response(
                {'error': f'Failed to send OTP: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )










# class VerifyPasswordChangeOTPView(APIView):
#     permission_classes = [IsAuthenticated]

#     @swagger_auto_schema(
#         operation_description="Verify OTP for password change",
#         request_body=openapi.Schema(
#             type=openapi.TYPE_OBJECT,
#             required=['otp'],
#             properties={
#                 'otp': openapi.Schema(type=openapi.TYPE_STRING)
#             }
#         ),
#         responses={200: 'OTP verified', 400: 'Invalid OTP'}
#     )
#     def post(self, request):
#         otp = request.data.get('otp')
        
#         if not otp:
#             return Response({'error': 'OTP is required'}, status=status.HTTP_400_BAD_REQUEST)
        
#         if request.user.verify_otp(otp):
#             return Response({'message': 'OTP verified successfully'})
#         else:
#             return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)


class VerifyPasswordChangeOTPView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Verify OTP for password change",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['otp'],
            properties={
                'otp': openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        responses={200: 'OTP verified', 400: 'Invalid OTP'}
    )
    def post(self, request):
        otp = request.data.get('otp')
        
        if not otp:
            return Response({'error': 'OTP is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.verify_otp(otp):
            # Set otp_verified to True after successful verification
            request.user.otp_verified = True
            request.user.save()
            
            # Log successful OTP verification
            AppLog.log_success(
                message="Password change OTP verified",
                source="VerifyPasswordChangeOTPView",
                details=f"User: {request.user.email}",
                user=request.user,
                request=request
            )
            
            return Response({'message': 'OTP verified successfully'})
        else:
            # Log failed OTP verification
            AppLog.log_warning(
                message="Invalid password change OTP",
                source="VerifyPasswordChangeOTPView",
                details=f"User: {request.user.email}",
                user=request.user,
                request=request
            )
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordWithOTPView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Change password with OTP verification",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['old_password', 'new_password'],
            properties={
                'old_password': openapi.Schema(type=openapi.TYPE_STRING),
                'new_password': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={200: 'Password changed successfully'}
    )
    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        # Validate inputs
        if not all([old_password, new_password]):
            return Response(
                {'error': 'Old password and new password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify old password
        if not request.user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if OTP was verified
        if not request.user.otp_verified:
            return Response(
                {'error': 'Please verify OTP first'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if OTP verification is still valid (within 10 minutes)
        if not request.user.is_otp_valid():
            return Response(
                {'error': 'OTP verification has expired. Please request a new OTP.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Change password
        request.user.set_password(new_password)
        request.user.otp_code = None
        request.user.otp_created_at = None
        request.user.otp_verified = False
        request.user.save()
        
        # Log successful password change
        AppLog.log_success(
            message="Password changed successfully",
            source="ChangePasswordWithOTPView",
            details=f"User: {request.user.email}",
            user=request.user,
            request=request
        )
        
        return Response({'message': 'Password changed successfully'})

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    @swagger_auto_schema(
        operation_description="Login and get JWT token pair",
        request_body=CustomTokenObtainPairSerializer,
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'access': openapi.Schema(type=openapi.TYPE_STRING),
                    'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                    'user': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'username': openapi.Schema(type=openapi.TYPE_STRING),
                            'email': openapi.Schema(type=openapi.TYPE_STRING),
                            'role': openapi.Schema(type=openapi.TYPE_STRING),
                            'profile_picture': openapi.Schema(type=openapi.TYPE_STRING),
                        }
                    )
                }
            ),
            400: 'Validation Error',
            401: 'Authentication Failed'
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:
                user_email = response.data.get('user', {}).get('email') or request.data.get('email')
                AppLog.log_success(
                    message="User logged in",
                    source="LoginView",
                    details=f"User: {user_email}",
                    request=request
                )
            return response
        except Exception as e:
            AppLog.log_error(
                message="User login failed",
                source="LoginView",
                details=str(e),
                request=request
            )
            raise