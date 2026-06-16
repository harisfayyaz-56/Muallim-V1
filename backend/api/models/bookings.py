from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from .users import Teacher


class TeacherAvailability(models.Model):
    """Teacher's available time slots"""
    DAY_CHOICES = (
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    )

    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.teacher.user.username} - {self.day_of_week} {self.start_time}-{self.end_time}"

    class Meta:
        verbose_name = "Teacher Availability"
        verbose_name_plural = "Teacher Availabilities"
        unique_together = ('teacher', 'day_of_week', 'start_time', 'end_time')


class Booking(models.Model):
    """Lesson bookings between students and teachers"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings_as_student')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='bookings')
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    scheduled_date = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60, validators=[MinValueValidator(15)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    amount = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    meeting_link = models.URLField(blank=True, null=True, help_text="Zoom/Google Meet link")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.student.username} -> {self.teacher.user.username} ({self.subject})"

    class Meta:
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        ordering = ['-scheduled_date']


class Review(models.Model):
    """Student reviews for teachers"""
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=255)
    comment = models.TextField()
    teaching_quality = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(5)])
    communication = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(5)])
    punctuality = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Review by {self.student.username} for {self.teacher.user.username}"

    class Meta:
        verbose_name = "Review"
        verbose_name_plural = "Reviews"
        unique_together = ('booking', 'student', 'teacher')
