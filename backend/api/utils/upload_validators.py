"""
File upload validation utilities for avatar/profile pictures
"""
from django.core.exceptions import ValidationError


# Maximum file size in bytes (5MB)
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB

# Allowed image formats
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
ALLOWED_MIME_TYPES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
}


def validate_avatar_file(file):
    """
    Validate avatar file for size and type.
    
    Args:
        file: Django UploadedFile object
        
    Raises:
        ValidationError: If file fails validation
        
    Returns:
        None (raises exception if invalid)
    """
    if not file:
        raise ValidationError("No file provided")

    # Check file size
    if file.size > MAX_AVATAR_SIZE:
        size_mb = file.size / (1024 * 1024)
        max_mb = MAX_AVATAR_SIZE / (1024 * 1024)
        raise ValidationError(
            f"File is too large ({size_mb:.1f}MB). "
            f"Maximum size is {max_mb:.0f}MB."
        )

    # Check file extension
    file_ext = file.name.split('.')[-1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Invalid file type '.{file_ext}'. "
            f"Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(
            f"Invalid file type '{file.content_type}'. "
            f"Only image files are allowed."
        )


def get_file_size_display(size_bytes):
    """
    Convert bytes to human-readable format.
    
    Args:
        size_bytes: File size in bytes
        
    Returns:
        String like "2.5MB" or "500KB"
    """
    for unit in ['B', 'KB', 'MB']:
        if size_bytes < 1024:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f}GB"
