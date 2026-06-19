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
    
    TIMEZONE_CHOICES = (
        ('Asia/Dubai', 'Dubai (GST, UTC+4)'),
        ('Asia/Abu_Dhabi', 'Abu Dhabi (GST, UTC+4)'),
        ('Asia/Sharjah', 'Sharjah (GST, UTC+4)'),
        ('Asia/Kolkata', 'India (IST, UTC+5:30)'),
        ('Asia/Karachi', 'Karachi (PKT, UTC+5)'),
        ('Europe/London', 'London (GMT, UTC+0)'),
        ('US/Eastern', 'Eastern (EST/EDT, UTC-5/-4)'),
        ('US/Central', 'Central (CST/CDT, UTC-6/-5)'),
        ('US/Mountain', 'Mountain (MST/MDT, UTC-7/-6)'),
        ('US/Pacific', 'Pacific (PST/PDT, UTC-8/-7)'),
        ('Europe/Paris', 'Central Europe (CET, UTC+1)'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    timezone = models.CharField(max_length=50, choices=TIMEZONE_CHOICES, default='Asia/Dubai')
    currency = models.CharField(max_length=3, default='AED', editable=False)
    email_verified = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
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

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    SESSION_DURATION_CHOICES = (
        ('30', '30 minutes'),
        ('60', '60 minutes'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    bio = models.TextField(blank=True, null=True)
    qualifications = models.TextField(help_text="List of qualifications and certifications")
    headline = models.CharField(max_length=255, blank=True, default="")
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES)
    subjects = models.CharField(max_length=500, help_text="Subjects taught, comma-separated")
    categories = models.CharField(max_length=500, blank=True, default="", help_text="Skill categories, comma-separated")
    languages = models.CharField(max_length=255, help_text="Languages spoken, comma-separated")
    tags = models.CharField(max_length=500, blank=True, default="", help_text="Custom skill tags, comma-separated")
    is_verified = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True, null=True)
    verification_date = models.DateTimeField(blank=True, null=True)
    rating = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_reviews = models.IntegerField(default=0)
    students_count = models.IntegerField(default=0)
    lessons_completed = models.IntegerField(default=0)
    session_duration = models.CharField(
        max_length=10, choices=SESSION_DURATION_CHOICES, default='60',
        help_text="Allowed session durations for booking"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Bi-directional sync for backwards compatibility
        if not self.headline and self.qualifications:
            self.headline = self.qualifications
        elif self.headline and not self.qualifications:
            self.qualifications = self.headline

        if not self.categories and self.subjects:
            self.categories = self.subjects
        elif self.categories and not self.subjects:
            self.subjects = self.categories

        if not self.tags and self.languages:
            self.tags = self.languages
        elif self.tags and not self.languages:
            self.languages = self.tags

        # Sync is_verified with status
        if self.status == 'approved':
            self.is_verified = True
        else:
            self.is_verified = False

        super().save(*args, **kwargs)

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
