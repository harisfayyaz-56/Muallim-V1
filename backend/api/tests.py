from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.models import UserProfile, Teacher, Booking
from api.models.bookings import TeacherAvailability
from datetime import datetime, date, time, timedelta

@override_settings(DEBUG=True)
class UserManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create student user
        self.student_user = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='password123',
            first_name='John',
            last_name='Doe'
        )
        self.student_profile = UserProfile.objects.create(
            user=self.student_user,
            user_type='student',
            email_verified=False,
            is_suspended=False,
            timezone='Asia/Dubai'
        )

        # Create teacher user
        self.teacher_user = User.objects.create_user(
            username='teacher',
            email='teacher@example.com',
            password='password123',
            first_name='Jane',
            last_name='Smith'
        )
        self.teacher_profile = UserProfile.objects.create(
            user=self.teacher_user,
            user_type='teacher',
            email_verified=True,
            is_suspended=False,
            timezone='Asia/Dubai'
        )
        self.teacher = Teacher.objects.create(
            user=self.teacher_user,
            hourly_rate=100.0,
            status='approved',
            session_duration='both',
            qualifications='Degree',
            experience_level='5-10',
            subjects='Math',
            languages='English'
        )

        # Create admin user
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpassword',
            first_name='Admin',
            last_name='User'
        )
        self.admin_profile = UserProfile.objects.create(
            user=self.admin_user,
            user_type='student',
            email_verified=True,
            is_suspended=False,
            timezone='Asia/Dubai'
        )

    def test_registration_and_verification_flow(self):
        # 1. Register a new user
        register_url = reverse('api-register')
        payload = {
            'email': 'newuser@example.com',
            'password': 'newpassword123',
            'password2': 'newpassword123',
            'first_name': 'New',
            'last_name': 'User',
            'timezone': 'Asia/Dubai'
        }
        response = self.client.post(register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['email_verified'])
        
        # Find the newly created user and their profile
        new_user = User.objects.get(email='newuser@example.com')
        new_profile = new_user.profile
        self.assertEqual(new_profile.timezone, 'Asia/Dubai')
        self.assertFalse(new_profile.email_verified)

        # 2. Resend verification
        resend_url = reverse('api-resend-verification')
        resend_resp = self.client.post(resend_url, {'email': 'newuser@example.com'}, format='json')
        self.assertEqual(resend_resp.status_code, status.HTTP_200_OK)
        # In debug mode/unconfigured SMTP, verify_url is in response. Otherwise, get it from outbox.
        verify_url = resend_resp.data.get('verify_url')
        if not verify_url:
            from django.core import mail
            import re
            if len(mail.outbox) > 0:
                email_body = mail.outbox[-1].body
                match = re.search(r'https?://[^\s]+', email_body)
                if match:
                    verify_url = match.group(0)
        self.assertIsNotNone(verify_url)

        # 3. Extract tokens from verify_url and perform GET/POST verification
        import urllib.parse
        parsed = urllib.parse.urlparse(verify_url)
        params = urllib.parse.parse_qs(parsed.query)
        uid = params['uid'][0]
        token = params['token'][0]

        verify_api_url = reverse('api-verify-email')
        verify_resp = self.client.post(verify_api_url, {'uid': uid, 'token': token}, format='json')
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_resp.data['email_verified'])
        self.assertIn('access', verify_resp.data)
        
        # Verify db updated
        new_profile.refresh_from_db()
        self.assertTrue(new_profile.email_verified)

    def test_suspended_user_cannot_login(self):
        # Verify email first, then suspend
        self.student_profile.email_verified = True
        self.student_profile.is_suspended = True
        self.student_profile.save()

        # Try to login
        login_url = reverse('token_obtain_pair')
        payload = {
            'email': 'student@example.com',
            'password': 'password123'
        }
        response = self.client.post(login_url, payload, format='json')
        # Check that login is blocked and message mentions suspension (custom validation returns 400)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('suspended', response.data['non_field_errors'][0].lower())

    def test_unverified_and_suspended_users_cannot_book(self):
        # Create a weekly availability availability
        # 2026-06-20 is a Saturday
        availability = TeacherAvailability.objects.create(
            teacher=self.teacher,
            day_of_week='saturday',
            start_time=time(10, 0),
            end_time=time(11, 0),
            is_available=True
        )

        booking_url = reverse('booking-list')
        booking_payload = {
            'teacher_id': self.teacher.id,
            'scheduled_date': '2026-06-20T06:00:00Z', # 06:00 UTC = 10:00 Asia/Dubai
            'duration_minutes': 60,
            'subject': 'Math',
            'amount': 100.0
        }

        # 1. Unverified user login & try booking
        # First verify student is not suspended, but unverified
        self.student_profile.email_verified = False
        self.student_profile.is_suspended = False
        self.student_profile.save()

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(booking_url, booking_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('verified', response.data['detail'].lower())

        # 2. Suspended user login & try booking
        # Make student verified, but suspended
        self.student_profile.email_verified = True
        self.student_profile.is_suspended = True
        self.student_profile.save()

        response = self.client.post(booking_url, booking_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('suspended', response.data['detail'].lower())

        # 3. Verified, non-suspended user booking allowed
        self.student_profile.email_verified = True
        self.student_profile.is_suspended = False
        self.student_profile.save()

        response = self.client.post(booking_url, booking_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_user_management(self):
        # 1. Non-staff access denied
        self.client.force_authenticate(user=self.student_user)
        
        users_url = '/api/profile/admin/users/'
        response = self.client.get(users_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        suspend_url = '/api/profile/admin/suspend/'
        response = self.client.post(suspend_url, {'user_id': self.teacher_user.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Staff access allowed
        self.client.force_authenticate(user=self.admin_user)
        
        # Get users
        response = self.client.get(users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should include student, teacher, admin
        usernames = [u['username'] for u in response.data]
        self.assertIn('student', usernames)
        self.assertIn('teacher', usernames)
        self.assertIn('admin', usernames)

        # Suspend teacher
        response = self.client.post(suspend_url, {'user_id': self.teacher_user.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.teacher_profile.refresh_from_db()
        self.assertTrue(self.teacher_profile.is_suspended)

        # Unsuspend teacher
        unsuspend_url = '/api/profile/admin/unsuspend/'
        response = self.client.post(unsuspend_url, {'user_id': self.teacher_user.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.teacher_profile.refresh_from_db()
        self.assertFalse(self.teacher_profile.is_suspended)

    def test_teacher_cannot_see_themselves_in_teacher_list(self):
        # Authenticate as teacher
        self.client.force_authenticate(user=self.teacher_user)
        
        # Get teacher list
        teachers_url = '/api/teacher/'
        response = self.client.get(teachers_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify self is not in the list
        teacher_ids = [t['id'] for t in response.data]
        self.assertNotIn(self.teacher.id, teacher_ids)

    def test_teacher_cannot_book_themselves(self):
        # Create availability for teacher
        # 2026-06-20 is a Saturday
        TeacherAvailability.objects.create(
            teacher=self.teacher,
            day_of_week='saturday',
            start_time=time(10, 0),
            end_time=time(11, 0),
            is_available=True
        )

        booking_url = '/api/bookings/'
        booking_payload = {
            'teacher_id': self.teacher.id,
            'scheduled_date': '2026-06-20T06:00:00Z', # 10:00 Asia/Dubai
            'duration_minutes': 60,
            'subject': 'Math',
            'amount': 100.0
        }

        # Authenticate as teacher and try to book themselves
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(booking_url, booking_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot book a session with yourself', response.data['teacher_id'][0].lower())

    def test_admin_can_approve_and_reject_teacher(self):
        # Create a pending teacher application
        pending_teacher_user = User.objects.create_user(
            username='pending_teacher',
            email='pending@example.com',
            password='password123'
        )
        UserProfile.objects.create(
            user=pending_teacher_user,
            user_type='teacher',
            email_verified=True,
            timezone='Asia/Dubai'
        )
        pending_teacher = Teacher.objects.create(
            user=pending_teacher_user,
            hourly_rate=120.0,
            status='pending',
            qualifications='Degree',
            experience_level='1-2',
            subjects='English',
            languages='English'
        )

        # 1. Non-staff try to approve/reject -> forbidden
        self.client.force_authenticate(user=self.student_user)
        approve_url = f'/api/teacher/{pending_teacher.id}/approve/'
        reject_url = f'/api/teacher/{pending_teacher.id}/reject/'
        
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        response = self.client.post(reject_url, {'reason': 'Insufficient bio'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Staff can approve/reject
        self.client.force_authenticate(user=self.admin_user)
        
        # Test reject first
        response = self.client.post(reject_url, {'reason': 'Insufficient bio'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_teacher.refresh_from_db()
        self.assertEqual(pending_teacher.status, 'rejected')
        self.assertEqual(pending_teacher.rejection_reason, 'Insufficient bio')

        # Test approve
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_teacher.refresh_from_db()
        self.assertEqual(pending_teacher.status, 'approved')

    def test_booking_removes_slot_immediately(self):
        # 1. Use a future date to bypass past-date filtering (e.g. 2028-06-20)
        # 2028-06-20 is a Tuesday
        future_date = date(2028, 6, 20)
        future_date_str = "2028-06-20"
        future_weekday = "tuesday"

        TeacherAvailability.objects.create(
            teacher=self.teacher,
            day_of_week=future_weekday,
            start_time=time(10, 0),
            end_time=time(11, 0),
            is_available=True
        )

        # Ensure teacher profile session_duration is 'both'
        self.teacher.session_duration = 'both'
        self.teacher.save()

        # 2. Query available slots for the future Tuesday
        slots_url = f'/api/teacher/{self.teacher.id}/slots/'
        
        # 30-min duration query
        resp_30 = self.client.get(slots_url, {'date': future_date_str, 'duration': '30'})
        self.assertEqual(resp_30.status_code, status.HTTP_200_OK)
        # Should have two slots: 10:00-10:30 and 10:30-11:00
        slots_30 = resp_30.data['slots']
        self.assertEqual(len(slots_30), 2)
        self.assertEqual(slots_30[0]['time'], '10:00')
        self.assertEqual(slots_30[1]['time'], '10:30')

        # 3. Create a booking for the first slot (10:00 - 10:30)
        # student_user books it.
        # 10:00 in Asia/Dubai (UTC+4) is 06:00 UTC
        self.student_profile.email_verified = True
        self.student_profile.save()
        self.client.force_authenticate(user=self.student_user)
        booking_url = reverse('booking-list')
        booking_payload = {
            'teacher_id': self.teacher.id,
            'scheduled_date': '2028-06-20T06:00:00Z',
            'duration_minutes': 30,
            'subject': 'Math',
            'amount': 50.0
        }
        booking_resp = self.client.post(booking_url, booking_payload, format='json')
        self.assertEqual(booking_resp.status_code, status.HTTP_201_CREATED)

        # 4. Query slots again - the 10:00 slot must be GONE immediately!
        resp_30_after = self.client.get(slots_url, {'date': future_date_str, 'duration': '30'})
        self.assertEqual(resp_30_after.status_code, status.HTTP_200_OK)
        slots_30_after = resp_30_after.data['slots']
        self.assertEqual(len(slots_30_after), 1)
        self.assertEqual(slots_30_after[0]['time'], '10:30')

        # 5. Querying 60-min slots should also reflect the removal (cannot book 60 min if 10:00-10:30 is booked)
        resp_60_after = self.client.get(slots_url, {'date': future_date_str, 'duration': '60'})
        self.assertEqual(resp_60_after.status_code, status.HTTP_200_OK)
        slots_60_after = resp_60_after.data['slots']
        self.assertEqual(len(slots_60_after), 0)
