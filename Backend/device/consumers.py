import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from .models import Device, Notification
from users.models import AppLog
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Get token from query string
            query_string = self.scope['query_string'].decode()
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]
            
            if token:
                try:
                    # Verify the token with timeout
                    access_token = AccessToken(token)
                    user_id = access_token['user_id']
                    
                    # Use asyncio.wait_for to add timeout to database operation
                    self.user = await asyncio.wait_for(
                        self.get_user(user_id), 
                        timeout=5.0  # 5 second timeout
                    )
                    
                    if self.user and not isinstance(self.user, AnonymousUser):
                        self.group_name = f'notifications_{self.user.id}'
                        
                        # Join user-specific notification group
                        await self.channel_layer.group_add(
                            self.group_name,
                            self.channel_name
                        )
                        
                        await self.accept()
                        logger.info(f"WebSocket connected for user: {self.user.username}")
                        
                        # Log WebSocket connection
                        await self.log_websocket_event("WebSocket connected", "success")
                        
                        # Send initial connection status
                        await self.send(text_data=json.dumps({
                            'type': 'connection',
                            'status': 'connected',
                            'user': self.user.username
                        }))
                    else:
                        logger.warning("WebSocket: Invalid user or anonymous user")
                        await self.log_websocket_event("WebSocket connection failed - invalid user", "error")
                        await self.close()
                        
                except asyncio.TimeoutError:
                    logger.error("WebSocket: Database operation timed out during authentication")
                    await self.log_websocket_event("WebSocket connection timeout", "error")
                    await self.close()
                except Exception as e:
                    logger.error(f"WebSocket auth error: {e}")
                    await self.log_websocket_event(f"WebSocket auth error: {str(e)}", "error")
                    await self.close()
            else:
                logger.warning("WebSocket: No token provided")
                await self.log_websocket_event("WebSocket connection failed - no token", "warning")
                await self.close()
                
        except Exception as e:
            logger.error(f"WebSocket connect error: {e}")
            await self.log_websocket_event(f"WebSocket connect error: {str(e)}", "error")
            await self.close()

    async def disconnect(self, close_code):
        try:
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
                logger.info(f"WebSocket disconnected for group: {self.group_name}")
                await self.log_websocket_event("WebSocket disconnected", "info")
        except Exception as e:
            logger.error(f"Error during WebSocket disconnect: {e}")

    async def receive(self, text_data):
        # Handle incoming messages if needed
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': asyncio.get_event_loop().time()
                }))
        except json.JSONDecodeError:
            logger.warning("WebSocket: Received invalid JSON data")
        except Exception as e:
            logger.error(f"WebSocket receive error: {e}")

    async def notification_message(self, event):
        # Send notification to WebSocket
        try:
            await self.send(text_data=json.dumps({
                'type': 'notification',
                'content': event['content']
            }))
        except Exception as e:
            logger.error(f"Error sending notification via WebSocket: {e}")

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning(f"User with ID {user_id} not found")
            return None
        except Exception as e:
            logger.error(f"Database error during user lookup: {e}")
            return None

    @database_sync_to_async
    def log_websocket_event(self, message, level):
        """Log WebSocket events to AppLog"""
        try:
            if hasattr(self, 'user') and self.user and not isinstance(self.user, AnonymousUser):
                if level == "success":
                    AppLog.log_success(
                        message=message,
                        source="WebSocket",
                        details=f"User: {self.user.email}",
                        user=self.user
                    )
                elif level == "error":
                    AppLog.log_error(
                        message=message,
                        source="WebSocket",
                        details=f"User: {self.user.email}",
                        user=self.user
                    )
                elif level == "warning":
                    AppLog.log_warning(
                        message=message,
                        source="WebSocket",
                        details=f"User: {self.user.email}",
                        user=self.user
                    )
                else:
                    AppLog.log_info(
                        message=message,
                        source="WebSocket",
                        details=f"User: {self.user.email}",
                        user=self.user
                    )
            else:
                # Log without user for anonymous connections
                if level == "success":
                    AppLog.log_success(
                        message=message,
                        source="WebSocket",
                        details="Anonymous connection"
                    )
                elif level == "error":
                    AppLog.log_error(
                        message=message,
                        source="WebSocket",
                        details="Anonymous connection"
                    )
                elif level == "warning":
                    AppLog.log_warning(
                        message=message,
                        source="WebSocket",
                        details="Anonymous connection"
                    )
                else:
                    AppLog.log_info(
                        message=message,
                        source="WebSocket",
                        details="Anonymous connection"
                    )
        except Exception as e:
            logger.error(f"Failed to log WebSocket event: {e}")