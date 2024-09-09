import json
from channels.generic.websocket import AsyncWebsocketConsumer
import logging

logger = logging.getLogger(__name__)

class AppointmentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated:
            self.room_group_name = f'user_{self.user.id}'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            logger.info(f"WebSocket connection established for user {self.user.id}")
        else:
            logger.warning("Unauthenticated WebSocket connection attempt")
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        logger.info(f"WebSocket connection closed for user {self.user.id}")

    async def receive(self, text_data):
        logger.info(f"Received WebSocket message: {text_data}")

    async def appointment_reminder(self, event):
        logger.info(f"Sending appointment reminder: {event}")
        await self.send(text_data=json.dumps({
            'type': 'appointment_reminder',
            'appointment_id': event['appointment_id']
        }))