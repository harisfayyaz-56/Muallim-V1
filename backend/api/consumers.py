import json
import re
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.db.models import Q
from api.models.support import Thread, Message
from django.core.mail import send_mail

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.room_group_name = f'chat_thread_{self.thread_id}'
        self.user = self.scope.get('user')

        # Check authentication
        if not self.user or self.user.is_anonymous:
            await self.close(code=4003)  # Unauthorized
            return

        # Check authorization: user must be student or teacher of this thread
        is_authorized = await self.check_thread_membership(self.thread_id, self.user)
        if not is_authorized:
            await self.close(code=4003)  # Unauthorized
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except ValueError:
            return

        content = data.get('content', '').strip()
        if not content:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'detail': 'Message content cannot be empty'
            }))
            return

        # Contact Sharing Bypass Validation
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        phone_pattern = r'(?:\+?\d[\s\-\(\)]*){7,15}\d'
        off_platform_patterns = [
            r'zoom\.us',
            r'meet\.google\.com',
            r'wa\.me',
            r'whatsapp\.com',
            r't\.me',
            r'telegram\.org',
            r'telegram\.me',
            r'facebook\.com',
            r'fb\.me',
            r'fb\.com',
            r'instagram\.com',
            r'linkedin\.com',
            r'twitter\.com',
            r'x\.com',
            r'https?://[^\s]+',
            r'www\.[^\s]+'
        ]

        if re.search(email_pattern, content):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'detail': 'Sharing email addresses is not allowed in chat to prevent off-platform bypass and ensure user safety.'
            }))
            return

        for match in re.finditer(phone_pattern, content):
            match_str = match.group()
            cleaned = re.sub(r'[\s\-\(\)\+]', '', match_str)
            if len(cleaned) >= 7 and cleaned.isdigit():
                if len(cleaned) == 8 and (cleaned.startswith('202') or cleaned.startswith('199') or cleaned.startswith('200') or cleaned.startswith('201')):
                    continue
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'detail': 'Sharing phone numbers is not allowed in chat to prevent off-platform bypass and ensure user safety.'
                }))
                return

        for pattern in off_platform_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'detail': 'Sharing external meeting, WhatsApp, or social links is not allowed in chat. Confirmed bookings automatically generate a secure Google Meet link.'
                }))
                return

        # Save message to database and trigger email
        message_data = await self.save_message(self.thread_id, self.user, content)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_data
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': message
        }))

    @database_sync_to_async
    def check_thread_membership(self, thread_id, user):
        return Thread.objects.filter(
            Q(id=thread_id) & (Q(student=user) | Q(teacher=user))
        ).exists()

    @database_sync_to_async
    def save_message(self, thread_id, sender, content):
        thread = Thread.objects.get(id=thread_id)
        recipient = thread.teacher if sender == thread.student else thread.student

        # Save message
        message = Message.objects.create(
            thread=thread,
            sender=sender,
            recipient=recipient,
            content=content,
            is_read=False
        )

        # Update thread updated_at timestamp
        import django.utils.timezone as tz
        thread.updated_at = tz.now()
        thread.save()

        # Send email notification
        try:
            sender_name = sender.get_full_name() or sender.username
            recipient_email = recipient.email
            if recipient_email:
                html_message = f"""
                <html>
                    <body>
                        <h2>New Message Received on Muallim</h2>
                        <p>Dear {recipient.get_full_name() or recipient.username},</p>
                        <p>You have received a new message from <strong>{sender_name}</strong>:</p>
                        <blockquote style="padding: 10px; background-color: #F8F6F1; border-left: 4px solid #C8962A; margin: 10px 0;">
                            {content}
                        </blockquote>
                        <p><a href="http://localhost:3000/messages" style="padding: 10px 20px; background-color: #C8962A; color: white; text-decoration: none; border-radius: 5px;">Reply to Message</a></p>
                        <p>Best regards,<br>Muallim Team</p>
                    </body>
                </html>
                """
                import threading
                threading.Thread(
                    target=send_mail,
                    kwargs={
                        "subject": f'New message from {sender_name} on Muallim',
                        "message": f'You have received a new message from {sender_name}: "{content[:100]}..."',
                        "from_email": None,
                        "recipient_list": [recipient_email],
                        "html_message": html_message,
                        "fail_silently": True,
                    },
                    daemon=True
                ).start()
        except Exception as e:
            print(f"Error sending message email notification in background: {str(e)}")

        from api.serializers import MessageSerializer
        return MessageSerializer(message).data
