from .auth import (
    RegisterView, 
    CustomTokenObtainPairView,
    UserDetailView,
    UserUpdateView,
    # ChangePasswordView,  # Remove this line
    UploadProfilePictureView,
    VerifyPasswordChangeOTPView,# Also remove this if it doesn't exist
    SendChangePasswordOTPView,
    VerifyPasswordChangeOTPView,
    ChangePasswordWithOTPView,
)
from .password_reset import ForgotPasswordView, ResetPasswordView  # Import VerifyOTPView from password_reset
from .google_auth import GoogleLoginAPIView
from .admin_check import test_admin_permission
from .user_management import (
    AdminUserListView,
    AdminUserDetailView,
    AdminUserDeleteView,
    AdminUserRoleUpdateView,
    AdminProfileView,
    AdminStatsView,
  
)
from .logs import (
    AdminLogsListView,
    AdminLogsFilterView,
    AdminLogsStatsView,
    export_logs_csv,
    export_logs_json,
    export_logs_pdf,
)

__all__ = [
    'RegisterView',
    'CustomTokenObtainPairView',
    'UserDetailView',
    'UserUpdateView',
    # 'ChangePasswordView',  # Remove this
    'UploadProfilePictureView',
    # 'VerifyOTPView',
    'SendChangePasswordOTPView',
    'VerifyPasswordChangeOTPView',
    'ChangePasswordWithOTPView',
    'ForgotPasswordView',
    'ResetPasswordView',
    'GoogleLoginAPIView',
    'test_admin_permission',
    'AdminUserListView',
    'AdminUserDetailView',
    'AdminUserDeleteView',
    'AdminUserRoleUpdateView',
    'AdminProfileView',
    'AdminStatsView',
    'AdminLogsListView',
    'AdminLogsFilterView',
    'AdminLogsStatsView',
    'export_logs_csv',
    'export_logs_json',
    'export_logs_pdf',
]