from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, AppLog
import cloudinary
import cloudinary.uploader

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    profile_picture = serializers.URLField(required=False, allow_null=True)
    role = serializers.ChoiceField(choices=[('user', 'User'), ('admin', 'Admin')], default='user', required=False)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'role', 'profile_picture')

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        profile_picture = validated_data.pop('profile_picture', None)
        role = validated_data.get('role', 'user')
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role
        )
        if profile_picture:
            user.profile_picture = profile_picture
            user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'role', 'profile_picture']

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'profile_picture']
        read_only_fields = ['email']  # Email cannot be changed

# Add new serializers for user management
class AdminUserListSerializer(serializers.ModelSerializer):
    """Serializer for listing all users (admin only)"""
    full_name = serializers.SerializerMethodField()
    last_login_formatted = serializers.SerializerMethodField()
    date_joined_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'role', 'profile_picture', 
            'full_name', 'is_active', 'last_login', 'date_joined',
            'last_login_formatted', 'date_joined_formatted'
        ]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() if obj.first_name or obj.last_name else obj.username
    
    def get_last_login_formatted(self, obj):
        if obj.last_login:
            return obj.last_login.strftime("%Y-%m-%d %H:%M")
        return "Never"
    
    def get_date_joined_formatted(self, obj):
        return obj.date_joined.strftime("%Y-%m-%d %H:%M")

class UserRoleUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user role (admin only)"""
    class Meta:
        model = CustomUser
        fields = ['role']
    
    def validate_role(self, value):
        if value not in ['user', 'admin']:
            raise serializers.ValidationError("Role must be either 'user' or 'admin'")
        return value

class AdminProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin profile updates"""
    full_name = serializers.SerializerMethodField()
    last_login_formatted = serializers.SerializerMethodField()
    date_joined_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 
            'profile_picture', 'role', 'full_name', 'last_login',
            'date_joined', 'last_login_formatted', 'date_joined_formatted'
        ]
        read_only_fields = ['id', 'email', 'role', 'last_login', 'date_joined']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() if obj.first_name or obj.last_name else obj.username
    
    def get_last_login_formatted(self, obj):
        if obj.last_login:
            return obj.last_login.strftime("%Y-%m-%d %H:%M")
        return "Never"
    
    def get_date_joined_formatted(self, obj):
        return obj.date_joined.strftime("%Y-%m-%d %H:%M")
    
    def validate_username(self, value):
        user = self.instance
        if CustomUser.objects.filter(username=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

class ProfilePictureSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True)

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'profile_picture': self.user.profile_picture,
        }
        return data

class AppLogSerializer(serializers.ModelSerializer):
    """Serializer for AppLog model"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    formatted_timestamp = serializers.SerializerMethodField()
    
    class Meta:
        model = AppLog
        fields = [
            'id', 'timestamp', 'formatted_timestamp', 'level', 'message', 
            'source', 'details', 'user_email', 'user_username', 
            'ip_address', 'user_agent'
        ]
        read_only_fields = ['id', 'timestamp', 'user_email', 'user_username', 'ip_address', 'user_agent']
    
    def get_formatted_timestamp(self, obj):
        """Format timestamp for display"""
        return obj.timestamp.strftime('%Y-%m-%d %H:%M:%S')
    
    def to_representation(self, instance):
        """Custom representation for API response"""
        data = super().to_representation(instance)
        # Convert UUID to string for JSON serialization
        data['id'] = str(data['id'])
        return data