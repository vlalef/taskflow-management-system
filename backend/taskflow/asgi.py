import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskflow.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from api.consumers import TaskConsumer

websocket_urlpatterns = [
    path('ws/boards/<int:board_id>/', TaskConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
