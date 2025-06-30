from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import (
    RegisterView,
    UserDetailView,
    UserUpdateView,
    CustomTokenObtainPairView,
    ForgotPasswordView,
    VerifyPasswordChangeOTPView,
    ResetPasswordView,
    UploadProfilePictureView,
    SendChangePasswordOTPView,
    VerifyPasswordChangeOTPView,
    ChangePasswordWithOTPView,
    test_admin_permission,
    GoogleLoginAPIView,
    AdminUserListView,
    AdminUserDetailView,
    AdminUserDeleteView,
    AdminUserRoleUpdateView,
    AdminProfileView,
    AdminStatsView,
    AdminLogsListView,
    AdminLogsFilterView,
    AdminLogsStatsView,
    export_logs_csv,
    export_logs_json,
    export_logs_pdf,
)

urlpatterns = [
    path('admin/logs/export/csv/', export_logs_csv, name='admin_logs_export_csv'),
    path('admin/logs/export/json/', export_logs_json, name='admin_logs_export_json'),
    path('admin/logs/export/pdf/', export_logs_pdf, name='admin_logs_export_pdf'),
    path('register/', RegisterView.as_view(), name='register'),
    path('user/', UserDetailView.as_view(), name='user_detail'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile endpoints
    path('user/update/', UserUpdateView.as_view(), name='user_update'),
    path('user/upload-picture/', UploadProfilePictureView.as_view(), name='upload_picture'),
    
    # Password change with OTP endpoints
    path('user/send-change-password-otp/', SendChangePasswordOTPView.as_view(), name='send_change_password_otp'),
    path('user/verify-password-change-otp/', VerifyPasswordChangeOTPView.as_view(), name='verify_password_change_otp'),
    path('user/change-password-with-otp/', ChangePasswordWithOTPView.as_view(), name='change_password_with_otp'),
    
    # Password reset endpoints with OTP
    path('forgot/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset/<uidb64>/<token>/', ResetPasswordView.as_view(), name='reset-password'),
    
    # Admin user management endpoints
    path('admin/users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<int:id>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('admin/users/<int:id>/delete/', AdminUserDeleteView.as_view(), name='admin_user_delete'),
    path('admin/users/<int:id>/role/', AdminUserRoleUpdateView.as_view(), name='admin_user_role_update'),
    path('admin/profile/', AdminProfileView.as_view(), name='admin_profile'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    
    # Admin logs management endpoints
    path('admin/logs/', AdminLogsListView.as_view(), name='admin_logs_list'),
    path('admin/logs/stats/', AdminLogsStatsView.as_view(), name='admin_logs_stats'),
    path('admin/logs/level/<str:level>/', AdminLogsFilterView.as_view(), name='admin_logs_filter'),
    
    # Other endpoints
    path('google-login/', GoogleLoginAPIView.as_view(), name='google_login'),
    path('admin/test/', test_admin_permission, name='test_admin_permission'),
]