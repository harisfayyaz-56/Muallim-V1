from django.http import JsonResponse
from django.db import connection
from django.core.exceptions import ValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer, TimezoneUpdateSerializer, AvatarUploadSerializer, TeacherSerializer
from .serializers import BookingSerializer, TeacherAvailabilityUpdateSerializer
from .models.bookings import Booking, TeacherAvailability
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

    @action(detail=False, methods=['get'], url_path='admin/users', permission_classes=[IsAuthenticated])
    def admin_users(self, request):
        """Admin: list all users with their profile info"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        from django.contrib.auth.models import User as AuthUser
        users = AuthUser.objects.all().select_related('profile').order_by('-date_joined')
        data = []
        for u in users:
            prof = getattr(u, 'profile', None)
            avatar_url = None
            if prof and prof.profile_picture:
                avatar_url = request.build_absolute_uri(prof.profile_picture.url)
            data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'name': u.get_full_name() or u.username,
                'is_staff': u.is_staff,
                'is_superuser': u.is_superuser,
                'is_active': u.is_active,
                'date_joined': u.date_joined.isoformat(),
                'user_type': prof.user_type if prof else 'student',
                'email_verified': prof.email_verified if prof else False,
                'is_suspended': prof.is_suspended if prof else False,
                'avatar': avatar_url or 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&auto=format',
                'timezone': prof.timezone if prof else 'Asia/Dubai',
            })
        return Response(data)

    @action(detail=False, methods=['post'], url_path='admin/suspend', permission_classes=[IsAuthenticated])
    def admin_suspend(self, request):
        """Admin: suspend a user"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.contrib.auth.models import User as AuthUser
        from django.shortcuts import get_object_or_404
        target_user = get_object_or_404(AuthUser, pk=user_id)
        
        # Prevent suspending yourself or other admins
        if target_user == request.user:
            return Response({'detail': 'Cannot suspend yourself'}, status=status.HTTP_400_BAD_REQUEST)
        if target_user.is_staff or target_user.is_superuser:
            return Response({'detail': 'Cannot suspend admin users'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        profile.is_suspended = True
        profile.save()
        return Response({'detail': 'User suspended', 'is_suspended': True})

    @action(detail=False, methods=['post'], url_path='admin/unsuspend', permission_classes=[IsAuthenticated])
    def admin_unsuspend(self, request):
        """Admin: unsuspend a user"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.contrib.auth.models import User as AuthUser
        from django.shortcuts import get_object_or_404
        target_user = get_object_or_404(AuthUser, pk=user_id)
        
        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        profile.is_suspended = False
        profile.save()
        return Response({'detail': 'User unsuspended', 'is_suspended': False})


class BookingViewSet(rf_viewsets.ModelViewSet):
    """ViewSet for bookings. Creation blocked for unverified or suspended users."""
    serializer_class = BookingSerializer
    queryset = Booking.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related('teacher__user', 'student')
        if user.is_staff or user.is_superuser:
            return qs
        
        role = self.request.query_params.get('role')
        if role == 'student':
            return qs.filter(student=user)
        elif role == 'teacher':
            if hasattr(user, 'teacher_profile'):
                return qs.filter(teacher__user=user)
            return qs.none()

        if hasattr(user, 'teacher_profile'):
            from django.db.models import Q
            return qs.filter(Q(teacher__user=user) | Q(student=user))
        return qs.filter(student=user)

    def get_permissions(self):
        perms = super().get_permissions()
        # add extra permissions for create
        if self.action == 'create':
            perms.append(IsEmailVerified())
            perms.append(IsNotSuspended())
        return perms

    def perform_create(self, serializer):
        import random
        # Generate a random 10-letter code for Google Meet
        code = "".join(random.choices("abcdefghijklmnopqrstuvwxyz", k=10))
        formatted_code = f"{code[:3]}-{code[3:7]}-{code[7:]}"
        meeting_link = f"https://meet.google.com/abc-{formatted_code}"
        serializer.save(student=self.request.user, status='confirmed', meeting_link=meeting_link)


class TeacherViewSet(viewsets.ModelViewSet):
    """ViewSet for teacher profile management"""
    serializer_class = TeacherSerializer

    def get_permissions(self):
        from rest_framework.permissions import AllowAny, IsAuthenticated
        if self.action in ['list', 'retrieve', 'availability', 'slots']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        from .models.users import Teacher
        if self.action in ['list', 'retrieve']:
            if self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser):
                return Teacher.objects.all()
            return Teacher.objects.filter(status='approved')
        return Teacher.objects.filter(user=self.request.user)

    def get_object(self):
        from .models.users import Teacher
        from django.shortcuts import get_object_or_404
        if self.action in ['retrieve', 'approve', 'reject', 'availability', 'slots']:
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
            return get_object_or_404(Teacher, **filter_kwargs)
        return get_object_or_404(Teacher, user=self.request.user)

    @action(detail=False, methods=['get', 'patch', 'post'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get, create, or update current user's teacher profile"""
        from .models.users import Teacher
        from .models import UserProfile
        from django.core.mail import send_mail
        from django.contrib.auth.models import User
        
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
            
            # Send email to admins
            try:
                admin_users = User.objects.filter(is_staff=True, is_superuser=True)
                admin_emails = [admin.email for admin in admin_users if admin.email]
                
                if admin_emails:
                    teacher_name = user.get_full_name() or user.username
                    html_message = f"""
                    <html>
                        <body>
                            <h2>New Teacher Application Submitted</h2>
                            <p>A new teacher has submitted their profile for verification.</p>
                            <p><strong>Teacher Name:</strong> {teacher_name}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Headline:</strong> {teacher.headline or teacher.qualifications}</p>
                            <p><strong>Hourly Rate:</strong> ${teacher.hourly_rate}</p>
                            <p><strong>Experience Level:</strong> {teacher.experience_level}</p>
                            <p><strong>Categories:</strong> {teacher.categories or teacher.subjects}</p>
                            <p><a href="http://localhost:3000/admin-panel" style="padding: 10px 20px; background-color: #C8962A; color: white; text-decoration: none; border-radius: 5px;">Review in Admin Panel</a></p>
                            <p>Best regards,<br>Muallim System</p>
                        </body>
                    </html>
                    """
                    send_mail(
                        subject='New Teacher Application Submitted',
                        message=f'A new teacher {teacher_name} ({user.email}) has submitted their profile for verification.',
                        from_email=None,
                        recipient_list=admin_emails,
                        html_message=html_message,
                        fail_silently=True,
                    )
            except Exception as e:
                print(f"Error sending admin notification: {str(e)}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # For GET and PATCH:
        try:
            teacher_profile = user.teacher_profile
        except Exception:
            return Response({'detail': 'Teacher profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'PATCH':
            serializer = self.get_serializer(teacher_profile, data=request.data, partial=True, context={'request': request})
            serializer.is_valid(raise_exception=True)
            teacher = serializer.save()
            # Reset status to pending upon update
            teacher.status = 'pending'
            teacher.save()
            return Response(self.get_serializer(teacher).data)

        serializer = self.get_serializer(teacher_profile, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def applications(self, request):
        """List all teacher applications for admin review"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        from .models.users import Teacher
        teachers = Teacher.objects.all().order_by('-created_at')
        
        data = []
        for t in teachers:
            user_profile = getattr(t.user, 'profile', None)
            avatar_url = request.build_absolute_uri(user_profile.profile_picture.url) if user_profile and user_profile.profile_picture else None
            data.append({
                'id': str(t.id),
                'teacherId': str(t.id),
                'name': t.user.get_full_name() or t.user.username,
                'email': t.user.email,
                'headline': t.headline or t.qualifications,
                'skills': [s.strip() for s in (t.categories or t.subjects or "").split(",") if s.strip()],
                'location': user_profile.location if user_profile else "",
                'hourlyRate': float(t.hourly_rate),
                'submittedDate': t.created_at.isoformat(),
                'status': t.status,
                'avatar': avatar_url or "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&auto=format",
                'rejectionReason': t.rejection_reason or ""
            })
        return Response(data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a teacher's verification request"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        from .models.users import Teacher
        from django.shortcuts import get_object_or_404
        from django.core.mail import send_mail
        
        teacher = get_object_or_404(Teacher, pk=pk)
        teacher.status = 'approved'
        from django.utils import timezone
        teacher.verification_date = timezone.now()
        teacher.save()
        
        # Send email to teacher
        try:
            teacher_name = teacher.user.get_full_name() or teacher.user.username
            html_message = f"""
            <html>
                <body>
                    <h2>Congratulations! Your Teacher Profile is Approved</h2>
                    <p>Dear {teacher_name},</p>
                    <p>We're excited to let you know that your teacher profile has been approved and verified by our admin team.</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Appear in the teacher directory</li>
                        <li>Accept student booking requests</li>
                        <li>Start teaching on our platform</li>
                    </ul>
                    <p><a href="http://localhost:3000" style="padding: 10px 20px; background-color: #C8962A; color: white; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
                    <p>Best regards,<br>Muallim Team</p>
                </body>
            </html>
            """
            send_mail(
                subject='Your Teacher Profile Has Been Approved',
                message=f'Your teacher profile has been approved. Log in to your dashboard to get started.',
                from_email=None,
                recipient_list=[teacher.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error sending approval email: {str(e)}")
        
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a teacher's verification request with a reason"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        from .models.users import Teacher
        from django.shortcuts import get_object_or_404
        from django.core.mail import send_mail
        
        teacher = get_object_or_404(Teacher, pk=pk)
        reason = request.data.get('reason', '')
        teacher.status = 'rejected'
        teacher.rejection_reason = reason
        teacher.save()
        
        # Send email to teacher
        try:
            teacher_name = teacher.user.get_full_name() or teacher.user.username
            html_message = f"""
            <html>
                <body>
                    <h2>Teacher Profile Review</h2>
                    <p>Dear {teacher_name},</p>
                    <p>Thank you for submitting your teacher profile for verification. After review by our admin team, we are unable to approve your profile at this time.</p>
                    <p><strong>Reason:</strong> {reason}</p>
                    <p>You can update your profile and resubmit for review. Please feel free to contact support if you have any questions.</p>
                    <p><a href="http://localhost:3000/teacher-settings" style="padding: 10px 20px; background-color: #C8962A; color: white; text-decoration: none; border-radius: 5px;">Update Profile</a></p>
                    <p>Best regards,<br>Muallim Team</p>
                </body>
            </html>
            """
            send_mail(
                subject='Teacher Profile Review Result',
                message=f'Your teacher profile was rejected. Reason: {reason}',
                from_email=None,
                recipient_list=[teacher.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error sending rejection email: {str(e)}")
        
        return Response({'status': 'rejected', 'rejection_reason': reason})

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated], url_path='me/availability')
    def me_availability(self, request):
        """Get or update current teacher's weekly availability."""
        from .models.users import Teacher
        from .availability_utils import (
            availabilities_to_grid, grid_to_availability_rows, get_teacher_timezone,
        )

        try:
            teacher = request.user.teacher_profile
        except Exception:
            return Response({'detail': 'Teacher profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'PATCH':
            serializer = TeacherAvailabilityUpdateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            if 'session_duration' in data:
                teacher.session_duration = data['session_duration']
                teacher.save(update_fields=['session_duration'])

            if 'grid' in data:
                TeacherAvailability.objects.filter(teacher=teacher).delete()
                rows = grid_to_availability_rows(data['grid'])
                TeacherAvailability.objects.bulk_create([
                    TeacherAvailability(teacher=teacher, **row) for row in rows
                ])

        grid = availabilities_to_grid(teacher.availabilities.all())
        return Response({
            'timezone': get_teacher_timezone(teacher),
            'session_duration': teacher.session_duration,
            'grid': grid,
        })

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Public weekly availability for a teacher."""
        from .availability_utils import (
            availabilities_to_slots_by_day, convert_weekly_slots_to_timezone, get_teacher_timezone,
        )

        teacher = self.get_object()
        slots_by_day = availabilities_to_slots_by_day(teacher.availabilities.filter(is_available=True))
        teacher_tz = get_teacher_timezone(teacher)
        viewer_tz = request.query_params.get('timezone', teacher_tz)

        return Response({
            'timezone': teacher_tz,
            'viewer_timezone': viewer_tz,
            'session_duration': teacher.session_duration,
            'slots_by_day': slots_by_day,
            'slots_by_day_viewer': convert_weekly_slots_to_timezone(slots_by_day, teacher_tz, viewer_tz),
        })

    @action(detail=True, methods=['get'])
    def slots(self, request, pk=None):
        """Get bookable slots for a specific date, excluding booked times."""
        from datetime import datetime
        from .availability_utils import generate_slots_for_date, get_teacher_timezone

        teacher = self.get_object()
        date_str = request.query_params.get('date')
        duration = int(request.query_params.get('duration', 60))
        viewer_tz = request.query_params.get('timezone', get_teacher_timezone(teacher))

        if not date_str:
            return Response({'detail': 'date query parameter is required (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        from datetime import datetime, time, timedelta
        from zoneinfo import ZoneInfo
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        start_dt = datetime.combine(target_date - timedelta(days=1), time.min, tzinfo=ZoneInfo('UTC'))
        end_dt = datetime.combine(target_date + timedelta(days=2), time.max, tzinfo=ZoneInfo('UTC'))

        active_bookings = teacher.bookings.filter(
            status__in=['pending', 'confirmed'],
            scheduled_date__range=(start_dt, end_dt),
        )
        slots = generate_slots_for_date(teacher, target_date, duration, viewer_tz, active_bookings)

        return Response({
            'date': date_str,
            'duration': duration,
            'teacher_timezone': get_teacher_timezone(teacher),
            'viewer_timezone': viewer_tz,
            'slots': slots,
        })