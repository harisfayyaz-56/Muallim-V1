from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with timezone support"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'phone', 'bio', 'profile_picture', 'location',
            'timezone', 'currency', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'currency', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        """Handle nested user data updates"""
        user_data = validated_data.pop('user', {})
        if user_data:
            user = instance.user
            user.first_name = user_data.get('first_name', user.first_name)
            user.last_name = user_data.get('last_name', user.last_name)
            user.save()
        return super().update(instance, validated_data)


class TimezoneUpdateSerializer(serializers.ModelSerializer):
    """Serializer for timezone updates only"""
    class Meta:
        model = UserProfile
        fields = ['timezone']
