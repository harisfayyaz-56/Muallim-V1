from django.http import JsonResponse
from django.db import connection
from django.core.exceptions import ValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer, TimezoneUpdateSerializer, AvatarUploadSerializer, TeacherSerializer
from .serializers import BookingSerializer
from .models.bookings import Booking
from .permissions import IsEmailVerified, IsNotSuspended
from rest_framework import viewsets as rf_viewsets


def health_check(request):
    try:
        connection.ensure_connection()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return JsonResponse({
        "status": "ok",
        "database": db_status,
    })


class UserProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for user profile management"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Users can only view/edit their own profile"""
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        """Get the authenticated user's profile"""
        obj, created = UserProfile.objects.get_or_create(user=self.request.user)
        return obj

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get or update current user's profile"""
        profile = self.get_object()
        if request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = self.get_serializer(profile, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def timezone(self, request):
        """Update user's timezone"""
        profile = self.get_object()
        serializer = TimezoneUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def timezones(self, request):
        """Get all available timezones"""
        from .models import UserProfile
        timezones = [
            {'value': tz[0], 'label': tz[1]} 
            for tz in UserProfile.TIMEZONE_CHOICES
        ]
        return Response(timezones)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def avatar(self, request):
        """Upload and update user's avatar"""
        profile = self.get_object()
        serializer = AvatarUploadSerializer(
            profile, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            # Build absolute URI for the profile picture
            avatar_url = request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None
            return Response(
                {
                    'success': True,
                    'message': 'Avatar uploaded successfully',
                    'profile_picture_url': avatar_url
                },
                status=status.HTTP_200_OK
            )
        
        # Return validation errors with clear messages
        return Response(
            {
                'success': False,
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['post'], url_path='set-password', permission_classes=[IsAuthenticated])
    def set_password(self, request):
        """Set password for user (for Google sign-in users without password)"""
        user = request.user
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response(
                {'detail': 'new_password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'detail': 'Password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'detail': 'Password set successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='change-password', permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change password for authenticated user"""
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {'detail': 'current_password and new_password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(current_password):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'detail': 'Password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'detail': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )


class BookingViewSet(rf_viewsets.ModelViewSet):
    """ViewSet for bookings. Creation blocked for unverified or suspended users."""
    serializer_class = BookingSerializer
    queryset = Booking.objects.all()
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        perms = super().get_permissions()
        # add extra permissions for create
        if self.action == 'create':
            perms.append(IsEmailVerified())
            perms.append(IsNotSuspended())
        return perms

    def perform_create(self, serializer):
        # ensure student is request.user
        serializer.save(student=self.request.user)


class TeacherViewSet(viewsets.ModelViewSet):
    """ViewSet for teacher profile management"""
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from .models.users import Teacher
        return Teacher.objects.filter(user=self.request.user)

    def get_object(self):
        from .models.users import Teacher
        from django.shortcuts import get_object_or_404
        return get_object_or_404(Teacher, user=self.request.user)

    @action(detail=False, methods=['get', 'patch', 'post'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get, create, or update current user's teacher profile"""
        from .models.users import Teacher
        from .models import UserProfile
        
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        if request.method == 'POST':
            if hasattr(user, 'teacher_profile'):
                return Response({'detail': 'Teacher profile already exists'}, status=status.HTTP_400_BAD_REQUEST)
            serializer = self.get_serializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            teacher = serializer.save()
            # If the user is currently a student, update user_type to 'both'
            if profile.user_type == 'student':
                profile.user_type = 'both'
                profile.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # For GET and PATCH:
        try:
            teacher_profile = user.teacher_profile
        except Exception:
            return Response({'detail': 'Teacher profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'PATCH':
            serializer = self.get_serializer(teacher_profile, data=request.data, partial=True, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        serializer = self.get_serializer(teacher_profile, context={'request': request})
        return Response(serializer.data)