from .models import Project, Board, Task
from rest_framework import serializers
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = '__all__'

    def create(self, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        task = Task.objects.create(**validated_data)
        if assigned_to_id:
            task.assigned_to_id = assigned_to_id
            task.save()
        return task


class BoardSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    boards = BoardSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'
