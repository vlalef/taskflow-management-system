from .views import ProjectViewSet, BoardViewSet, TaskViewSet, register_user
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from django.urls import path, include

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'boards', BoardViewSet, basename='board')
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_user, name='register'),
    path('token-auth/', obtain_auth_token, name='api_token_auth'),
]
