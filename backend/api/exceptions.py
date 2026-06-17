from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that ensures all errors return JSON
    """
    response = exception_handler(exc, context)
    
    if response is None:
        # Handle exceptions that the default handler doesn't catch
        return Response(
            {'detail': str(exc) or 'An error occurred'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return response
