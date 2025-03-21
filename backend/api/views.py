from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Project, Board, Task
from .serializers import ProjectSerializer, BoardSerializer, TaskSerializer, UserSerializer
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from django.contrib.auth.models import User


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(
            Q(owner=self.request.user) | Q(members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            project.members.add(user)
            return Response({'status': 'user added'})
        except User.DoesNotExist:
            return Response({'error': 'user not found'}, status=404)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        project = self.get_object()
        stats = {
            'total_tasks': Task.objects.filter(board__project=project).count(),
            'completed_tasks': Task.objects.filter(board__project=project, status='DONE').count(),
            'in_progress': Task.objects.filter(board__project=project, status='IN_PROGRESS').count(),
            'overdue': Task.objects.filter(board__project=project, due_date__lt=timezone.now()).exclude(
                status='DONE').count(),
            'by_user': Task.objects.filter(board__project=project).values('assigned_to__username').annotate(
                count=Count('id'))
        }
        return Response(stats)


class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Board.objects.filter(
            Q(project__owner=self.request.user) | Q(project__members=self.request.user)
        ).distinct()


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            Q(board__project__owner=self.request.user) |
            Q(board__project__members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


@api_view(['POST'])
@permission_classes([AllowAny])
def obtain_token(request):
    from rest_framework.authtoken.views import ObtainAuthToken
    return ObtainAuthToken().as_view()(request)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        if user:
            from rest_framework.authtoken.models import Token
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': serializer.data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
