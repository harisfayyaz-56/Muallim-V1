from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class UserProfile(models.Model):
    """Extended user profile for all users"""
    USER_TYPE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('both', 'Both Student and Teacher'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.user_type})"

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"


class Teacher(models.Model):
    """Teacher profile with qualifications and specialties"""
    EXPERIENCE_LEVEL_CHOICES = (
        ('beginner', 'Beginner (0-1 year)'),
        ('intermediate', 'Intermediate (1-3 years)'),
        ('advanced', 'Advanced (3-5 years)'),
        ('expert', 'Expert (5+ years)'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    bio = models.TextField(blank=True, null=True)
    qualifications = models.TextField(help_text="List of qualifications and certifications")
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES)
    subjects = models.CharField(max_length=500, help_text="Subjects taught, comma-separated")
    languages = models.CharField(max_length=255, help_text="Languages spoken, comma-separated")
    is_verified = models.BooleanField(default=False)
    verification_date = models.DateTimeField(blank=True, null=True)
    rating = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_reviews = models.IntegerField(default=0)
    students_count = models.IntegerField(default=0)
    lessons_completed = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Teacher: {self.user.get_full_name() or self.user.username}"

    class Meta:
        verbose_name = "Teacher"
        verbose_name_plural = "Teachers"


class Student(models.Model):
    """Student profile with learning goals"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    grade_level = models.CharField(max_length=50, blank=True, null=True, help_text="e.g., High School, College, Self-Learning")
    learning_goals = models.TextField(blank=True, null=True)
    preferred_subjects = models.CharField(max_length=500, blank=True, null=True, help_text="Preferred subjects, comma-separated")
    languages = models.CharField(max_length=255, blank=True, null=True, help_text="Languages, comma-separated")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Student: {self.user.get_full_name() or self.user.username}"

    class Meta:
        verbose_name = "Student"
        verbose_name_plural = "Students"
