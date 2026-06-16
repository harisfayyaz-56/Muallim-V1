"""
Database models for the tutoring platform.

Organized into logical modules:
- users: User, Teacher, Student profiles
- bookings: Lessons, availability, reviews
- payments: Transactions, wallets
- support: Messaging, disputes, admin requests
"""

from .users import UserProfile, Teacher, Student
from .bookings import TeacherAvailability, Booking, Review
from .payments import Payment, Wallet, WalletTransaction
from .support import Message, Dispute, AdminRequest

__all__ = [
    'UserProfile',
    'Teacher',
    'Student',
    'TeacherAvailability',
    'Booking',
    'Review',
    'Payment',
    'Wallet',
    'WalletTransaction',
    'Message',
    'Dispute',
    'AdminRequest',
]
