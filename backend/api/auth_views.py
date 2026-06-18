from django.contrib.auth.models import User
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.urls import reverse
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.shortcuts import get_object_or_404

from rest_framework import status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Accept either email or username in the same field.
        self.fields.pop('username', None)
        self.fields['email'] = serializers.CharField(required=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        return token

    def validate(self, attrs):
        login_value = attrs.get('email')
        password = attrs.get('password')

        if not login_value or not password:
            raise serializers.ValidationError('Email or username and password are required')

        user = None
        if '@' in login_value:
            user = User.objects.filter(email=login_value).first()
        else:
            user = User.objects.filter(username=login_value).first()

        if not user:
            raise serializers.ValidationError('No active account found with the given credentials')

        if not user.check_password(password):
            raise serializers.ValidationError('No active account found with the given credentials')

        if not user.is_active:
            raise serializers.ValidationError('Account is disabled')

        # Check email verification for regular users only.
        # Admin/superuser accounts must be able to log in to manage the platform.
        try:
            profile = user.profile
        except Exception:
            profile = None

        if profile and not profile.email_verified and not (user.is_staff or user.is_superuser):
            raise serializers.ValidationError('Email not verified. Please check your email for verification link.')

        # Prevent suspended users
        if profile and profile.is_suspended:
            raise serializers.ValidationError('Account suspended')

        # Generate tokens
        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        self.user = user
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

from .models import UserProfile
from .serializers import UserProfileSerializer

import google.auth.transport.requests
import google.oauth2.id_token
from rest_framework_simplejwt.tokens import RefreshToken
import os


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')

        if not email or not password:
            return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'detail': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique username from email
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(username=username, email=email, password=password, first_name=first_name, last_name=last_name)
        # create profile
        timezone = data.get('timezone', 'Asia/Dubai')
        valid_timezones = [choice[0] for choice in UserProfile.TIMEZONE_CHOICES]
        if timezone not in valid_timezones:
            timezone = 'Asia/Dubai'
        profile = UserProfile.objects.create(user=user, timezone=timezone)

        # Send verification email
        email_info = self._send_verification_email(user, request)

        resp_data = {
            'detail': 'User created. Verification email sent.',
            'email': email,
            'email_verified': False,
            'email_sent': email_info['sent']
        }
        
        if not email_info['sent'] and settings.DEBUG:
            resp_data['verify_url'] = email_info['verify_url']

        return Response(resp_data, status=status.HTTP_201_CREATED)

    def _send_verification_email(self, user, request):
        """Send verification email to user"""
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        frontend_domain = os.environ.get('FRONTEND_DOMAIN', 'http://localhost:3000')
        verify_url = f"{frontend_domain}/verify-email?uid={uid}&token={token}"
        
        # Print verification link clearly in console for local testing/logs
        print(f"\n[EMAIL VERIFICATION] Verification link generated:\n{verify_url}\n")
        
        # Check if email is actually configured
        email_host_user = os.environ.get('EMAIL_HOST_USER', '')
        smtp_configured = email_host_user and email_host_user != 'your-gmail@gmail.com'
        
        if not smtp_configured:
            print("[EMAIL VERIFICATION] SMTP credentials not configured. Skipping send_mail and using console fallback.")
            return {'sent': False, 'verify_url': verify_url}
            
        try:
            html_message = f"""
            <html>
                <body>
                    <h2>Welcome to Muallim!</h2>
                    <p>Please verify your email by clicking the link below:</p>
                    <a href="{verify_url}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                        Verify Email
                    </a>
                    <p>Or copy this link: {verify_url}</p>
                    <p>This link will expire in 24 hours.</p>
                </body>
            </html>
            """
            
            send_mail(
                subject='Verify your Muallim Account',
                message=f'Please verify your email by visiting: {verify_url}',
                from_email=None,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return {'sent': True, 'verify_url': verify_url}
        except Exception as e:
            print(f"Error sending verification email: {str(e)}")
            return {'sent': False, 'verify_url': verify_url}


class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """Resend verification email"""
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            profile = user.profile
            
            if profile.email_verified:
                return Response({'detail': 'Email already verified'}, status=status.HTTP_200_OK)
            
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            frontend_domain = os.environ.get('FRONTEND_DOMAIN', 'http://localhost:3000')
            verify_url = f"{frontend_domain}/verify-email?uid={uid}&token={token}"
            
            # Print verification link clearly in console for local testing/logs
            print(f"\n[EMAIL VERIFICATION RESEND] Verification link generated:\n{verify_url}\n")
            
            html_message = f"""
            <html>
                <body>
                    <h2>Verify your Muallim Account</h2>
                    <p>Please verify your email by clicking the link below:</p>
                    <a href="{verify_url}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                        Verify Email
                    </a>
                    <p>Or copy this link: {verify_url}</p>
                </body>
            </html>
            """
            
            # Check if email is actually configured
            email_host_user = os.environ.get('EMAIL_HOST_USER', '')
            smtp_configured = email_host_user and email_host_user != 'your-gmail@gmail.com'
            
            email_sent = False
            
            if smtp_configured:
                try:
                    send_mail(
                        subject='Verify your Muallim Account',
                        message=f'Please verify your email by visiting: {verify_url}',
                        from_email=None,
                        recipient_list=[user.email],
                        html_message=html_message,
                        fail_silently=False,
                    )
                    email_sent = True
                except Exception as mail_err:
                    print(f"Error sending verification email: {str(mail_err)}")
            else:
                print("[EMAIL VERIFICATION RESEND] SMTP credentials not configured. Skipping send_mail and using console fallback.")
            
            resp_data = {
                'detail': 'Verification email sent' if email_sent else 'Verification link generated in backend console.',
                'email_sent': email_sent
            }
            
            if not email_sent and settings.DEBUG:
                resp_data['verify_url'] = verify_url

            return Response(resp_data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        uidb64 = request.query_params.get('uid')
        token = request.query_params.get('token')
        return self._verify(uidb64, token)

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        return self._verify(uidb64, token)

    def _verify(self, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({'detail': 'Invalid verification link'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.email_verified = True
            profile.save()
            
            # Auto-login user by generating tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'detail': 'Email verified successfully',
                'email_verified': True,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'username': user.username
                }
            }, status=status.HTTP_200_OK)
        return Response({'detail': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'If the email exists, a reset link will be sent.'}, status=status.HTTP_200_OK)

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        frontend_domain = os.environ.get('FRONTEND_DOMAIN', 'http://localhost:3000')
        reset_url = f"{frontend_domain}/reset-password?uid={uid}&token={token}"

        html_message = f"""
        <html>
            <body>
                <h2>Reset your Muallim Password</h2>
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <a href="{reset_url}" style="padding: 10px 20px; background-color: #C8962A; color: white; text-decoration: none; border-radius: 5px;">
                    Reset Password
                </a>
                <p>Or copy this link: {reset_url}</p>
                <p>If you did not request this, you can safely ignore this email.</p>
                <p>Best regards,<br>Muallim Team</p>
            </body>
        </html>
        """

        # Try sending email using the configured backend
        try:
            send_mail(
                subject='Reset your Muallim Password',
                message=f'Reset your password here: {reset_url}',
                from_email=None,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as mail_err:
            print(f"Error sending password reset email: {str(mail_err)}")

        resp_data = {'detail': 'If the email exists, a reset link will be sent.'}
        return Response(resp_data, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not uidb64 or not token or not new_password:
            return Response({'detail': 'uid, token and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({'detail': 'Invalid link'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'detail': 'Password has been reset'}, status=status.HTTP_200_OK)
        return Response({'detail': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        id_token = request.data.get('id_token')
        if not id_token:
            return Response({'detail': 'id_token required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            request_obj = google.auth.transport.requests.Request()
            # Validate the token and ensure the audience matches our Google client ID
            google_client_id = os.environ.get('GOOGLE_CLIENT_ID')
            if google_client_id:
                id_info = google.oauth2.id_token.verify_oauth2_token(id_token, request_obj, google_client_id)
            else:
                # If client ID not set in env, fall back to standard verification
                id_info = google.oauth2.id_token.verify_oauth2_token(id_token, request_obj)
        except Exception:
            # Log exception for debugging
            import traceback
            traceback.print_exc()
            return Response({'detail': 'Invalid id_token'}, status=status.HTTP_400_BAD_REQUEST)

        email = id_info.get('email')
        if not email:
            return Response({'detail': 'Google account has no email'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique username for new users
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user, created = User.objects.get_or_create(email=email, defaults={
            'username': username,
            'first_name': id_info.get('given_name', ''),
            'last_name': id_info.get('family_name', ''),
            'is_active': True,
        })
        timezone = request.data.get('timezone', 'Asia/Dubai')
        valid_timezones = [choice[0] for choice in UserProfile.TIMEZONE_CHOICES]
        if timezone not in valid_timezones:
            timezone = 'Asia/Dubai'

        if created:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.email_verified = True
            profile.timezone = timezone
            profile.save()
        else:
            # Ensure existing Google users also have email_verified=True
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.email_verified = True
            if profile.timezone == 'Asia/Dubai' and timezone != 'Asia/Dubai':
                profile.timezone = timezone
            profile.save()
        # Issue JWT tokens for the user
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        return Response({
            'detail': 'Google authentication accepted',
            'email': email,
            'access': access_token,
            'refresh': refresh_token,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Logout by blacklisting the provided refresh token"""
    permission_classes = [AllowAny]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'detail': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Blacklist the refresh token
            token = OutstandingToken.objects.get(token=refresh)
            BlacklistedToken.objects.get_or_create(token=token)
        except OutstandingToken.DoesNotExist:
            # Token not found; still return success to avoid leaking info
            pass
        return Response({'detail': 'Logged out'}, status=status.HTTP_200_OK)
