from django.contrib import admin
from django.utils.html import format_html
from .models import (
    UserProfile, Teacher, Student, TeacherAvailability,
    Booking, Review, Message, Payment, Wallet, WalletTransaction,
    Dispute, AdminRequest
)


# =====================
# User Profile Admin
# =====================

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_type', 'phone', 'location', 'timezone', 'currency', 'created_at')
    list_filter = ('user_type', 'timezone', 'created_at')
    search_fields = ('user__username', 'user__email', 'phone')
    readonly_fields = ('created_at', 'updated_at', 'currency')
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Profile Info', {'fields': ('user_type', 'bio', 'phone', 'location', 'profile_picture')}),
        ('Preferences', {'fields': ('timezone', 'currency')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


# =====================
# Teacher Admin
# =====================

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('get_name', 'hourly_rate', 'experience_level', 'rating_display', 'is_verified', 'lessons_completed')
    list_filter = ('experience_level', 'is_verified', 'created_at')
    search_fields = ('user__username', 'user__email', 'subjects')
    readonly_fields = ('created_at', 'updated_at', 'rating', 'total_reviews', 'students_count', 'lessons_completed')
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Basic Info', {'fields': ('bio', 'qualifications', 'subjects', 'languages')}),
        ('Pricing', {'fields': ('hourly_rate',)}),
        ('Experience', {'fields': ('experience_level',)}),
        ('Verification', {'fields': ('is_verified', 'verification_date')}),
        ('Statistics', {'fields': ('rating', 'total_reviews', 'students_count', 'lessons_completed'), 'classes': ('collapse',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_name.short_description = 'Teacher Name'

    def rating_display(self, obj):
        color = 'green' if obj.rating >= 4 else 'orange' if obj.rating >= 3 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">★ {}/{}</span>',
            color, obj.rating, 5
        )
    rating_display.short_description = 'Rating'


# =====================
# Student Admin
# =====================

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('get_name', 'grade_level', 'created_at')
    list_filter = ('grade_level', 'created_at')
    search_fields = ('user__username', 'user__email', 'preferred_subjects')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Learning Info', {'fields': ('grade_level', 'learning_goals', 'preferred_subjects', 'languages')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_name.short_description = 'Student Name'


# =====================
# Teacher Availability Admin
# =====================

@admin.register(TeacherAvailability)
class TeacherAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'day_of_week', 'start_time', 'end_time', 'is_available')
    list_filter = ('day_of_week', 'is_available', 'teacher')
    search_fields = ('teacher__user__username',)
    fieldsets = (
        ('Teacher', {'fields': ('teacher',)}),
        ('Availability', {'fields': ('day_of_week', 'start_time', 'end_time', 'is_available')}),
    )


# =====================
# Booking Admin
# =====================

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_student', 'get_teacher', 'subject', 'status_badge', 'scheduled_date', 'amount')
    list_filter = ('status', 'scheduled_date', 'created_at')
    search_fields = ('student__username', 'teacher__user__username', 'subject')
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
    fieldsets = (
        ('Participants', {'fields': ('student', 'teacher')}),
        ('Lesson Details', {'fields': ('subject', 'description', 'scheduled_date', 'duration_minutes')}),
        ('Meeting', {'fields': ('meeting_link',)}),
        ('Booking Info', {'fields': ('status', 'amount', 'notes')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'completed_at'), 'classes': ('collapse',)}),
    )

    def get_student(self, obj):
        return obj.student.get_full_name() or obj.student.username
    get_student.short_description = 'Student'

    def get_teacher(self, obj):
        return obj.teacher.user.get_full_name() or obj.teacher.user.username
    get_teacher.short_description = 'Teacher'

    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'confirmed': 'blue',
            'completed': 'green',
            'cancelled': 'red',
            'no_show': 'red',
        }
        return format_html(
            '<span style="padding: 3px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            colors.get(obj.status, 'gray'), obj.get_status_display()
        )
    status_badge.short_description = 'Status'


# =====================
# Review Admin
# =====================

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_student', 'get_teacher', 'rating_stars', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('student__username', 'teacher__user__username', 'title')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Booking', {'fields': ('booking',)}),
        ('Reviewer', {'fields': ('student',)}),
        ('Teacher', {'fields': ('teacher',)}),
        ('Review Content', {'fields': ('title', 'comment')}),
        ('Ratings', {'fields': ('rating', 'teaching_quality', 'communication', 'punctuality')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def get_student(self, obj):
        return obj.student.get_full_name() or obj.student.username
    get_student.short_description = 'Reviewer'

    def get_teacher(self, obj):
        return obj.teacher.user.get_full_name() or obj.teacher.user.username
    get_teacher.short_description = 'Teacher Reviewed'

    def rating_stars(self, obj):
        return format_html('★ ' * obj.rating + '☆ ' * (5 - obj.rating))
    rating_stars.short_description = 'Rating'


# =====================
# Message Admin
# =====================

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_sender', 'get_recipient', 'preview', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('sender__username', 'recipient__username', 'content')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Participants', {'fields': ('sender', 'recipient')}),
        ('Message', {'fields': ('content', 'is_read')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def get_sender(self, obj):
        return obj.sender.get_full_name() or obj.sender.username
    get_sender.short_description = 'From'

    def get_recipient(self, obj):
        return obj.recipient.get_full_name() or obj.recipient.username
    get_recipient.short_description = 'To'

    def preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    preview.short_description = 'Message'


# =====================
# Payment Admin
# =====================

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'get_student', 'get_teacher', 'amount', 'payment_status_badge', 'created_at')
    list_filter = ('payment_status', 'payment_method', 'created_at')
    search_fields = ('transaction_id', 'student__username', 'teacher__user__username')
    readonly_fields = ('created_at', 'completed_at', 'transaction_id')
    fieldsets = (
        ('Booking', {'fields': ('booking',)}),
        ('Participants', {'fields': ('student', 'teacher')}),
        ('Payment Details', {'fields': ('amount', 'commission', 'teacher_earns', 'payment_method')}),
        ('Status', {'fields': ('payment_status', 'transaction_id')}),
        ('Timestamps', {'fields': ('created_at', 'completed_at'), 'classes': ('collapse',)}),
    )

    def get_student(self, obj):
        return obj.student.get_full_name() or obj.student.username
    get_student.short_description = 'Student'

    def get_teacher(self, obj):
        return obj.teacher.user.get_full_name() or obj.teacher.user.username
    get_teacher.short_description = 'Teacher'

    def payment_status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'completed': 'green',
            'failed': 'red',
            'refunded': 'blue',
        }
        return format_html(
            '<span style="padding: 3px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            colors.get(obj.payment_status, 'gray'), obj.get_payment_status_display()
        )
    payment_status_badge.short_description = 'Status'


# =====================
# Wallet Admin
# =====================

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('get_user', 'balance_display', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Balance', {'fields': ('balance',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def get_user(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_user.short_description = 'User'

    def balance_display(self, obj):
        color = 'green' if obj.balance > 0 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">${}</span>',
            color, obj.balance
        )
    balance_display.short_description = 'Balance'


# =====================
# Wallet Transaction Admin
# =====================

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_user', 'transaction_type_badge', 'amount', 'description', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('wallet__user__username', 'description', 'reference')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Wallet', {'fields': ('wallet',)}),
        ('Transaction', {'fields': ('amount', 'transaction_type', 'description', 'reference')}),
        ('Timestamps', {'fields': ('created_at',), 'classes': ('collapse',)}),
    )

    def get_user(self, obj):
        return obj.wallet.user.get_full_name() or obj.wallet.user.username
    get_user.short_description = 'User'

    def transaction_type_badge(self, obj):
        color = 'green' if obj.transaction_type == 'credit' else 'red'
        return format_html(
            '<span style="padding: 3px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            color, obj.get_transaction_type_display()
        )
    transaction_type_badge.short_description = 'Type'


# =====================
# Dispute Admin
# =====================

@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'get_student', 'status_badge', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'student__username', 'description')
    readonly_fields = ('created_at', 'resolved_at')
    fieldsets = (
        ('Booking', {'fields': ('booking',)}),
        ('Dispute Info', {'fields': ('student', 'title', 'description')}),
        ('Resolution', {'fields': ('status', 'resolution')}),
        ('Timestamps', {'fields': ('created_at', 'resolved_at'), 'classes': ('collapse',)}),
    )

    def get_student(self, obj):
        return obj.student.get_full_name() or obj.student.username
    get_student.short_description = 'Student'

    def status_badge(self, obj):
        colors = {
            'open': 'orange',
            'in_review': 'blue',
            'resolved': 'green',
            'closed': 'gray',
        }
        return format_html(
            '<span style="padding: 3px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            colors.get(obj.status, 'gray'), obj.get_status_display()
        )
    status_badge.short_description = 'Status'


# =====================
# Admin Request Admin
# =====================

@admin.register(AdminRequest)
class AdminRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'request_type', 'title', 'get_user', 'status_badge', 'created_at')
    list_filter = ('request_type', 'status', 'created_at')
    search_fields = ('title', 'user__username', 'description')
    readonly_fields = ('created_at', 'reviewed_at')
    fieldsets = (
        ('Request', {'fields': ('user', 'request_type', 'title', 'description')}),
        ('Review', {'fields': ('status', 'admin_notes')}),
        ('Timestamps', {'fields': ('created_at', 'reviewed_at'), 'classes': ('collapse',)}),
    )

    def get_user(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_user.short_description = 'User'

    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red',
        }
        return format_html(
            '<span style="padding: 3px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            colors.get(obj.status, 'gray'), obj.get_status_display()
        )
    status_badge.short_description = 'Status'
