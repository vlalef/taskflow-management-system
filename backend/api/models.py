from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_projects")
    members = models.ManyToManyField(User, related_name="projects")

    def __str__(self):
        return self.title


class Board(models.Model):
    name = models.CharField(max_length=100)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="boards")

    def __str__(self):
        return f"{self.name} - {self.project.title}"


class TaskStatus(models.TextChoices):
    TODO = 'TODO', 'To Do'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    REVIEW = 'REVIEW', 'Review'
    DONE = 'DONE', 'Done'


class Task(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO
    )
    priority = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    due_date = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="assigned_tasks")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_tasks")
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="tasks")

    def __str__(self):
        return self.title
