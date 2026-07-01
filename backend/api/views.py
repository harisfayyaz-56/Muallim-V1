from django.http import JsonResponse
from django.db import connection
from django.db.models import Q
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
        if user.has_usable_password():
            return Response(
                {'detail': 'Password already set. Use change-password instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )
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
                'avatar': avatar_url,
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

    @action(detail=False, methods=['delete'], url_path='delete-account', permission_classes=[IsAuthenticated])
    def delete_account(self, request):
        """Permanently delete user's account and all associated data"""
        user = request.user
        user.delete()
        return Response({'detail': 'Account deleted successfully'})


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
        import uuid
        from decimal import Decimal
        from django.utils import timezone
        from .models.payments import Payment
        
        # Generate a real Google Meet link via the Google Calendar API (Option A - OAuth 2.0 Free Mode).
        # Authenticates on behalf of the central calendar owner using the OAuth 2.0 Refresh Token.
        meeting_link = None
        try:
            from django.conf import settings as django_settings
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build

            creds = Credentials(
                token=None,
                refresh_token=django_settings.GOOGLE_CALENDAR_REFRESH_TOKEN,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=django_settings.GOOGLE_CALENDAR_CLIENT_ID,
                client_secret=django_settings.GOOGLE_CALENDAR_CLIENT_SECRET,
                scopes=['https://www.googleapis.com/auth/calendar']
            )
            service = build('calendar', 'v3', credentials=creds)

            # Determine start/end time from serializer validated data
            booking_data = serializer.validated_data
            start_dt = booking_data.get('scheduled_date')
            duration_minutes = booking_data.get('duration_minutes', 60)
            from datetime import timedelta as _timedelta
            end_dt = start_dt + _timedelta(minutes=duration_minutes)

            # Query the Teacher object using teacher_id from booking_data
            from .models.users import Teacher
            teacher_id = booking_data.get('teacher_id')
            teacher = Teacher.objects.filter(pk=teacher_id).first()

            student_name = self.request.user.get_full_name() or self.request.user.username
            teacher_name = teacher.user.get_full_name() if (teacher and teacher.user) else 'Teacher'

            # Build attendees list safely
            attendees = []
            if self.request.user.email:
                attendees.append({'email': self.request.user.email})
            if teacher and teacher.user and teacher.user.email:
                attendees.append({'email': teacher.user.email})

            event_body = {
                'summary': f'Muallim Session: {student_name} with {teacher_name}',
                'start': {
                    'dateTime': start_dt.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_dt.isoformat(),
                    'timeZone': 'UTC',
                },
                # Inviting teacher & student as attendees so they can join
                # the Google Meet directly without needing the host to admit them.
                'attendees': attendees,
                'conferenceData': {
                    'createRequest': {
                        'requestId': f"muallim-{uuid.uuid4().hex}",
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'},
                    }
                },
            }


            created_event = service.events().insert(
                calendarId=django_settings.GOOGLE_CALENDAR_ID,
                body=event_body,
                conferenceDataVersion=1,
            ).execute()

            # Extract the real Google Meet link from the API response
            entry_points = created_event.get('conferenceData', {}).get('entryPoints', [])
            for ep in entry_points:
                if ep.get('entryPointType') == 'video':
                    meeting_link = ep.get('uri')
                    break

        except Exception as e:
            print(f"[Google Meet] Failed to create meeting via Calendar API: {e}")

        # Fallback: if Google API fails for any reason, use Jitsi so booking still works
        if not meeting_link:
            room_id = uuid.uuid4().hex[:16]
            meeting_link = f"https://meet.jit.si/Muallim-{room_id}"

        
        booking = serializer.save(
            student=self.request.user, 
            status='confirmed', 
            meeting_link=meeting_link
        )
        
        # Create corresponding mock payment record (mock escrow / holding_mock)
        amount = booking.amount
        commission = amount * Decimal('0.12')
        teacher_earns = amount - commission
        
        Payment.objects.create(
            booking=booking,
            student=self.request.user,
            teacher=booking.teacher,
            amount=amount,
            commission=commission,
            teacher_earns=teacher_earns,
            payment_method='mock',
            payment_status='holding_mock',
            transaction_id=f"mock_tx_{uuid.uuid4().hex[:12]}",
            completed_at=timezone.now()
        )


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
                qs = Teacher.objects.all()
            else:
                qs = Teacher.objects.filter(status='approved')

            if self.action == 'list' and self.request.user.is_authenticated:
                qs = qs.exclude(user=self.request.user)
            return qs
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
                'avatar': avatar_url,
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

        active_bookings = teacher.bookings.exclude(
            status__in=['cancelled', 'no_show']
        ).filter(
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


class ChatViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        from .models.support import Thread
        from .serializers import ThreadSerializer
        # Get all threads where current user is student OR teacher
        threads = Thread.objects.filter(Q(student=request.user) | Q(teacher=request.user)).order_by('-updated_at')
        serializer = ThreadSerializer(threads, many=True, context={'request': request})
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        from .models.support import Thread, Message
        from .serializers import ThreadSerializer
        from django.shortcuts import get_object_or_404
        # Get thread where current user is student OR teacher
        thread = get_object_or_404(Thread, Q(id=pk) & (Q(student=request.user) | Q(teacher=request.user)))
        
        # Mark all messages in this thread received by current user as read
        unread_msgs = Message.objects.filter(thread=thread, recipient=request.user, is_read=False)
        unread_msgs.update(is_read=True)
        
        serializer = ThreadSerializer(thread, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='start')
    def start_thread(self, request):
        from .models.users import Teacher
        from .models.support import Thread
        from .serializers import ThreadSerializer
        from django.shortcuts import get_object_or_404
        
        teacher_id = request.data.get('teacher_id')
        if not teacher_id:
            return Response({'detail': 'teacher_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        teacher = get_object_or_404(Teacher, pk=teacher_id)
        
        if teacher.user == request.user:
            return Response({'detail': 'You cannot start a conversation with yourself.'}, status=status.HTTP_400_BAD_REQUEST)
            
        thread, created = Thread.objects.get_or_create(student=request.user, teacher=teacher.user)
        if not created:
            import django.utils.timezone as tz
            thread.updated_at = tz.now()
            thread.save()
            
        serializer = ThreadSerializer(thread, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='send_message')
    def send_message(self, request, pk=None):
        import re
        from django.core.mail import send_mail
        from .models.support import Thread, Message
        from .serializers import MessageSerializer
        from django.shortcuts import get_object_or_404
        
        thread = get_object_or_404(Thread, Q(id=pk) & (Q(student=request.user) | Q(teacher=request.user)))
        content = request.data.get('content', '').strip()
        
        if not content:
            return Response({'detail': 'Message content cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            
        # 1. Contact Sharing Bypass Validation
        # Email address
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        # Phone number: 7-15 digits allowing spaces, dashes, parentheses
        phone_pattern = r'(?:\+?\d[\s\-\(\)]*){7,15}\d'
        
        off_platform_patterns = [
            r'zoom\.us',
            r'meet\.google\.com',
            r'wa\.me',
            r'whatsapp\.com',
            r't\.me',
            r'telegram\.org',
            r'telegram\.me',
            r'facebook\.com',
            r'fb\.me',
            r'fb\.com',
            r'instagram\.com',
            r'linkedin\.com',
            r'twitter\.com',
            r'x\.com',
            r'https?://[^\s]+',
            r'www\.[^\s]+'
        ]
        
        if re.search(email_pattern, content):
            return Response(
                {'detail': 'Sharing email addresses is not allowed in chat to prevent off-platform bypass and ensure user safety.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        for match in re.finditer(phone_pattern, content):
            match_str = match.group()
            cleaned = re.sub(r'[\s\-\(\)\+]', '', match_str)
            if len(cleaned) >= 7 and cleaned.isdigit():
                if len(cleaned) == 8 and (cleaned.startswith('202') or cleaned.startswith('199') or cleaned.startswith('200') or cleaned.startswith('201')):
                    continue
                return Response(
                    {'detail': 'Sharing phone numbers is not allowed in chat to prevent off-platform bypass and ensure user safety.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        for pattern in off_platform_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return Response(
                    {'detail': 'Sharing external meeting, WhatsApp, or social links is not allowed in chat. Confirmed bookings automatically generate a secure Google Meet link.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # 2. Save message
        recipient = thread.teacher if request.user == thread.student else thread.student
        message = Message.objects.create(
            thread=thread,
            sender=request.user,
            recipient=recipient,
            content=content,
            is_read=False
        )
        
        # Touch the thread to update its updated_at timestamp
        import django.utils.timezone as tz
        thread.updated_at = tz.now()
        thread.save()
        
        # 3. Email Notification to recipient
        try:
            sender_name = request.user.get_full_name() or request.user.username
            recipient_email = recipient.email
            if recipient_email:
                html_message = f"""
                <html>
                    <body>
                        <h2>New Message Received on Muallim</h2>
                        <p>Dear {recipient.get_full_name() or recipient.username},</p>
                        <p>You have received a new message from <strong>{sender_name}</strong>:</p>
                        <blockquote style="padding: 10px; background-color: #F8F6F1; border-left: 4px solid #C8962A; margin: 10px 0;">
                            {content}
                        </blockquote>
                        <p><a href="http://localhost:3000/messages" style="padding: 10px 20px; background-color: #C8962A; color: white; text-decoration: none; border-radius: 5px;">Reply to Message</a></p>
                        <p>Best regards,<br>Muallim Team</p>
                    </body>
                </html>
                """
                send_mail(
                    subject=f'New message from {sender_name} on Muallim',
                    message=f'You have received a new message from {sender_name}: "{content[:100]}..."',
                    from_email=None,
                    recipient_list=[recipient_email],
                    html_message=html_message,
                    fail_silently=True,
                )
        except Exception as e:
            print(f"Error sending message email notification: {str(e)}")
            
        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='mark_read')
    def mark_read(self, request, pk=None):
        from .models.support import Thread, Message
        from django.shortcuts import get_object_or_404
        thread = get_object_or_404(Thread, Q(id=pk) & (Q(student=request.user) | Q(teacher=request.user)))
        Message.objects.filter(thread=thread, recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'read'})