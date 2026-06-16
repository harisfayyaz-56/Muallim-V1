from django.db import models
from django.contrib.auth.models import User
from .bookings import Booking


class Message(models.Model):
    """Direct messages between students and teachers"""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_sent')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_received')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}"

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ['-created_at']


class Dispute(models.Model):
    """Disputes for lesson bookings"""
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('in_review', 'In Review'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    )

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='dispute')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='disputes')
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    resolution = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Dispute: {self.title} - {self.status}"

    class Meta:
        verbose_name = "Dispute"
        verbose_name_plural = "Disputes"
        ordering = ['-created_at']


class AdminRequest(models.Model):
    """Teacher verification and feature requests"""
    REQUEST_TYPE_CHOICES = (
        ('teacher_verification', 'Teacher Verification'),
        ('feature_request', 'Feature Request'),
        ('report', 'Report'),
    )

    REQUEST_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_requests')
    request_type = models.CharField(max_length=30, choices=REQUEST_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=REQUEST_STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.request_type}: {self.title} - {self.status}"

    class Meta:
        verbose_name = "Admin Request"
        verbose_name_plural = "Admin Requests"
        ordering = ['-created_at']
