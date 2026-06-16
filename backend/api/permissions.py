from rest_framework.permissions import BasePermission


class IsEmailVerified(BasePermission):
    message = 'Email address is not verified.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        try:
            profile = user.profile
            return bool(profile.email_verified)
        except Exception:
            return False


class IsNotSuspended(BasePermission):
    message = 'Account is suspended.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        try:
            profile = user.profile
            return not bool(profile.is_suspended)
        except Exception:
            return True
