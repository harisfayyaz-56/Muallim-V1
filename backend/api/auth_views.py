from django.contrib.auth.models import User
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.urls import reverse
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
        # Replace the default 'username' field with 'email'
        self.fields.pop('username', None)
        self.fields['email'] = serializers.EmailField(required=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        return token

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError('Email and password are required')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('No active account found with the given credentials')

        if not user.check_password(password):
            raise serializers.ValidationError('No active account found with the given credentials')

        if not user.is_active:
            raise serializers.ValidationError('Account is disabled')

        # Prevent suspended users
        if hasattr(user, 'profile') and user.profile.is_suspended:
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
        UserProfile.objects.get_or_create(user=user)

        # send verification email
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verify_path = reverse('api-verify-email')
        current_site = get_current_site(request)
        verify_url = f"{request.scheme}://{current_site.domain}{verify_path}?uid={uid}&token={token}"

        send_mail(
            subject='Verify your email',
            message=f'Please verify your email by visiting: {verify_url}',
            from_email=None,
            recipient_list=[email],
            fail_silently=True,
        )

        return Response({'detail': 'User created. Verification email sent.'}, status=status.HTTP_201_CREATED)


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
            return Response({'detail': 'Email verified successfully'}, status=status.HTTP_200_OK)
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
        reset_path = reverse('api-password-reset-confirm')
        current_site = get_current_site(request)
        reset_url = f"{request.scheme}://{current_site.domain}{reset_path}?uid={uid}&token={token}"

        send_mail(
            subject='Password reset',
            message=f'Reset your password here: {reset_url}',
            from_email=None,
            recipient_list=[email],
            fail_silently=True,
        )
        return Response({'detail': 'If the email exists, a reset link will be sent.'}, status=status.HTTP_200_OK)


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
        if created:
            UserProfile.objects.get_or_create(user=user)
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
