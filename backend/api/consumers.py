import json
from .models import Task, TaskStatus
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class TaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.board_id = self.scope['url_route']['kwargs']['board_id']
        self.board_group_name = f'board_{self.board_id}'

        await self.channel_layer.group_add(
            self.board_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.board_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        task_id = data['task_id']
        action = data['action']

        if action == 'update_status':
            new_status = data['status']
            await self.update_task_status(task_id, new_status)
            await self.channel_layer.group_send(
                self.board_group_name,
                {
                    'type': 'task_update',
                    'task_id': task_id,
                    'action': action,
                    'status': new_status
                }
            )

    async def task_update(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def update_task_status(self, task_id, new_status):
        try:
            task = Task.objects.get(id=task_id)
            if new_status in dict(TaskStatus.choices).keys():
                task.status = new_status
                task.save()
                return True
            return False
        except Task.DoesNotExist:
            return False
