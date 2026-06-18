from rest_framework import serializers
from .models import UserProfile
from .utils.upload_validators import validate_avatar_file
from .models.bookings import Booking
from rest_framework import serializers as rf_serializers


class BookingSerializer(rf_serializers.ModelSerializer):
    student = rf_serializers.HiddenField(default=rf_serializers.CurrentUserDefault())
    teacher_id = rf_serializers.IntegerField(write_only=True, required=True)
    teacher_id_read = rf_serializers.SerializerMethodField()
    teacher_name = rf_serializers.SerializerMethodField()
    teacher_avatar = rf_serializers.SerializerMethodField()
    student_name = rf_serializers.SerializerMethodField()
    student_avatar = rf_serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'student', 'teacher_id', 'teacher_id_read', 'teacher_name', 'teacher_avatar',
            'student_name', 'student_avatar', 'subject', 'description', 'scheduled_date',
            'duration_minutes', 'status', 'amount', 'meeting_link', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'student', 'status', 'teacher_id_read', 'teacher_name', 'teacher_avatar',
            'student_name', 'student_avatar', 'meeting_link', 'created_at', 'updated_at'
        ]

    def get_teacher_id_read(self, obj):
        return obj.teacher_id

    def get_teacher_name(self, obj):
        return obj.teacher.user.get_full_name() or obj.teacher.user.username

    def get_teacher_avatar(self, obj):
        profile = getattr(obj.teacher.user, 'profile', None)
        request = self.context.get('request')
        if profile and profile.profile_picture:
            return request.build_absolute_uri(profile.profile_picture.url) if request else profile.profile_picture.url
        return "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&auto=format"

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username

    def get_student_avatar(self, obj):
        profile = getattr(obj.student, 'profile', None)
        request = self.context.get('request')
        if profile and profile.profile_picture:
            return request.build_absolute_uri(profile.profile_picture.url) if request else profile.profile_picture.url
        return "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&auto=format"

    def validate_teacher_id(self, value):
        from .models.users import Teacher
        try:
            teacher = Teacher.objects.get(pk=value)
            if teacher.status != 'approved':
                raise rf_serializers.ValidationError('Teacher is not available for bookings')
            
            # Prevent booking oneself
            request = self.context.get('request')
            if request and request.user == teacher.user:
                raise rf_serializers.ValidationError('You cannot book a session with yourself')
        except Teacher.DoesNotExist:
            raise rf_serializers.ValidationError('Teacher not found')
        return value

    def validate(self, attrs):
        from .models.users import Teacher
        from .availability_utils import validate_booking_slot

        teacher_id = self.initial_data.get('teacher_id')
        scheduled_date = attrs.get('scheduled_date')
        duration_minutes = attrs.get('duration_minutes', 60)

        if teacher_id and scheduled_date:
            try:
                teacher = Teacher.objects.get(pk=teacher_id)
                validate_booking_slot(teacher, scheduled_date, duration_minutes)
            except ValueError as e:
                raise rf_serializers.ValidationError({'scheduled_date': str(e)})
        return attrs

    def create(self, validated_data):
        teacher_id = validated_data.pop('teacher_id')
        from .models.users import Teacher
        teacher = Teacher.objects.get(pk=teacher_id)
        booking = Booking.objects.create(teacher=teacher, **validated_data)
        return booking


class TeacherAvailabilityUpdateSerializer(rf_serializers.Serializer):
    grid = rf_serializers.DictField(child=rf_serializers.ListField(child=rf_serializers.CharField()), required=False)
    session_duration = rf_serializers.ChoiceField(choices=['30', '60', 'both'], required=False)



class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with timezone support"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    has_password = serializers.SerializerMethodField()
    has_teacher_profile = serializers.SerializerMethodField()
    teacher_status = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)
    is_superuser = serializers.BooleanField(source='user.is_superuser', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'phone', 'bio', 'profile_picture', 'location',
            'timezone', 'currency', 'created_at', 'updated_at', 'has_password',
            'has_teacher_profile', 'teacher_status', 'is_staff', 'is_superuser'
        ]
        read_only_fields = ['id', 'currency', 'created_at', 'updated_at']

    def get_has_password(self, obj):
        return obj.user.has_usable_password()

    def get_has_teacher_profile(self, obj):
        return hasattr(obj.user, 'teacher_profile')

    def get_teacher_status(self, obj):
        if hasattr(obj.user, 'teacher_profile'):
            return obj.user.teacher_profile.status
        return None

    def update(self, instance, validated_data):
        """Handle nested user data updates"""
        user_data = validated_data.pop('user', {})
        if user_data:
            user = instance.user
            user.first_name = user_data.get('first_name', user.first_name)
            user.last_name = user_data.get('last_name', user.last_name)
            user.save()
        return super().update(instance, validated_data)


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for teacher profile"""
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    status = serializers.CharField(read_only=True)
    rejection_reason = serializers.CharField(read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()

    class Meta:
        from .models.users import Teacher
        model = Teacher
        fields = [
            'id', 'user', 'bio', 'headline', 'categories', 'tags', 'qualifications', 'hourly_rate',
            'experience_level', 'subjects', 'languages', 'is_verified', 'session_duration',
            'status', 'rejection_reason', 'rating', 'total_reviews', 'students_count',
            'lessons_completed', 'created_at', 'updated_at',
            'name', 'email', 'avatar', 'location'
        ]
        read_only_fields = [
            'id', 'is_verified', 'status', 'rejection_reason', 'rating', 'total_reviews',
            'students_count', 'lessons_completed', 'created_at', 'updated_at',
            'name', 'email', 'avatar', 'location'
        ]

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_email(self, obj):
        return obj.user.email

    def get_avatar(self, obj):
        profile = getattr(obj.user, 'profile', None)
        request = self.context.get('request')
        if profile and profile.profile_picture:
            return request.build_absolute_uri(profile.profile_picture.url) if request else profile.profile_picture.url
        return "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&auto=format"

    def get_location(self, obj):
        profile = getattr(obj.user, 'profile', None)
        return profile.location if profile else ""


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
