from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth_views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'profile', views.UserProfileViewSet, basename='profile')
router.register(r'bookings', views.BookingViewSet, basename='booking')
router.register(r'teacher', views.TeacherViewSet, basename='teacher')

urlpatterns = [
    path('health/', views.health_check),
    path('auth/register/', auth_views.RegisterView.as_view(), name='api-register'),
    path('auth/verify-email/', auth_views.VerifyEmailView.as_view(), name='api-verify-email'),
    path('auth/resend-verification/', auth_views.ResendVerificationEmailView.as_view(), name='api-resend-verification'),
    path('auth/password-reset/', auth_views.PasswordResetRequestView.as_view(), name='api-password-reset'),
    path('auth/password-reset-confirm/', auth_views.PasswordResetConfirmView.as_view(), name='api-password-reset-confirm'),
    path('auth/google/', auth_views.GoogleAuthView.as_view(), name='api-google-auth'),
    path('auth/logout/', auth_views.LogoutView.as_view(), name='api-logout'),
    path('auth/token/', auth_views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]