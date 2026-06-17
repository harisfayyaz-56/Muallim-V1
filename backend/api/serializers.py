from rest_framework import serializers
from .models import UserProfile
from .utils.upload_validators import validate_avatar_file
from .models.bookings import Booking
from rest_framework import serializers as rf_serializers


class BookingSerializer(rf_serializers.ModelSerializer):
    student = rf_serializers.HiddenField(default=rf_serializers.CurrentUserDefault())
    teacher_id = rf_serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'student', 'teacher_id', 'subject', 'description', 'scheduled_date',
            'duration_minutes', 'status', 'amount', 'meeting_link', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'student', 'status', 'created_at', 'updated_at']

    def validate_teacher_id(self, value):
        from .models.users import Teacher
        try:
            Teacher.objects.get(pk=value)
        except Teacher.DoesNotExist:
            raise rf_serializers.ValidationError('Teacher not found')
        return value

    def create(self, validated_data):
        teacher_id = validated_data.pop('teacher_id')
        from .models.users import Teacher
        teacher = Teacher.objects.get(pk=teacher_id)
        booking = Booking.objects.create(teacher=teacher, **validated_data)
        return booking



class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with timezone support"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'phone', 'bio', 'profile_picture', 'location',
            'timezone', 'currency', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'currency', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        """Handle nested user data updates"""
        user_data = validated_data.pop('user', {})
        if user_data:
            user = instance.user
            user.first_name = user_data.get('first_name', user.first_name)
            user.last_name = user_data.get('last_name', user.last_name)
            user.save()
        return super().update(instance, validated_data)


class TimezoneUpdateSerializer(serializers.ModelSerializer):
    """Serializer for timezone updates only"""
    class Meta:
        model = UserProfile
        fields = ['timezone']


class AvatarUploadSerializer(serializers.ModelSerializer):
    """Serializer for avatar upload with validation"""
    profile_picture = serializers.ImageField(required=True)
    
    class Meta:
        model = UserProfile
        fields = ['profile_picture']
    
    def validate_profile_picture(self, value):
        """Validate avatar file before saving"""
        if value:
            validate_avatar_file(value)
        return value
    
    def to_representation(self, instance):
        """Return avatar URL after upload"""
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.profile_picture:
            representation['profile_picture_url'] = request.build_absolute_uri(
                instance.profile_picture.url
            ) if request else instance.profile_picture.url
        return representation
