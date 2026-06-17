from django.http import JsonResponse
from django.db import connection
from django.core.exceptions import ValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer, TimezoneUpdateSerializer, AvatarUploadSerializer
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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user's profile"""
        profile = self.get_object()
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
            return Response(
                {
                    'success': True,
                    'message': 'Avatar uploaded successfully',
                    'profile_picture_url': profile.profile_picture.url if profile.profile_picture else None
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