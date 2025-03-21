# TaskFlow Management System - Backend

TaskFlow is a comprehensive project management system designed to streamline team collaboration through real-time task management. The backend is built with Django REST Framework and Channels for WebSocket support, providing a robust API for the frontend to interact with.

## Distinctiveness and Complexity

TaskFlow stands out from other projects in this course due to several distinctive features and implementation choices:

1. **Real-time Collaboration**: Unlike the e-commerce, social media, and wiki projects covered in the course, TaskFlow implements WebSocket connections via Django Channels to provide instant updates across connected clients when task statuses change. This represents a shift from traditional request-response architecture to event-driven real-time communication.

2. **Comprehensive Project Management**: The system goes beyond basic CRUD operations by implementing a complete project management workflow with hierarchical data relationships (projects contain boards, which contain tasks). The data model reflects the complex relationships found in professional project management tools, with fine-grained access controls and comprehensive activity tracking.

3. **Role-based Access Control**: The permission system ensures users can only access projects they own or are members of, with appropriate actions available based on their role. This creates a multi-tenant architecture where data isolation between teams is enforced at the database query level.

4. **Analytics Dashboard**: The API provides aggregate statistics about project progress, workload distribution, and deadline tracking - transforming raw task data into actionable insights. This required implementing complex database queries using Django's ORM aggregation and annotation features.

5. **Integration-ready Architecture**: The token-based authentication system and RESTful API design make it easy to integrate with various frontend frameworks or third-party services. The API follows REST principles with proper resource naming, HTTP methods, and status codes.

The complexity of this implementation lies in:

- The relational data model with multiple interconnected entities (Projects, Boards, Tasks) and complex many-to-many relationships for team membership
- Real-time WebSocket communication for collaborative features, requiring asynchronous code and handling group-based messaging
- Complex permission logic controlling access to resources based on user roles and relationships
- Analytics calculations across multiple dimensions using Django's advanced ORM features
- Token-based authentication for secure API access and proper request validation
- Proper error handling and validation across all endpoints

Compared to other projects in the course, TaskFlow implements a more sophisticated backend architecture that handles real-time updates, complex permissions, and hierarchical data relationships that go well beyond the requirements of previous assignments.

## File Contents and Structure

### Core Files
- `taskflow/settings.py`: Contains project settings including database configuration, installed apps, middleware, and Channels configuration for WebSockets.
- `taskflow/urls.py`: Main URL routing configuration for the project.
- `taskflow/asgi.py`: ASGI configuration for WebSocket support, sets up the ProtocolTypeRouter for handling both HTTP and WebSocket connections.
- `taskflow/wsgi.py`: WSGI configuration for traditional HTTP requests.

### API Application Files
- `api/models.py`: Defines the data models for:
  - `Project`: Core project entity with title, description, owner, and members.
  - `Board`: Kanban-style board belonging to a project.
  - `Task`: Work item with title, description, status, priority, due date, and assignments.
  - `TaskStatus`: Enumeration of possible task states (TODO, IN_PROGRESS, REVIEW, DONE).

- `api/serializers.py`: Contains serializers for converting model instances to JSON:
  - `UserSerializer`: Handles user data representation.
  - `TaskSerializer`: Handles task creation and representation with nested user data.
  - `BoardSerializer`: Represents boards with nested task data.
  - `ProjectSerializer`: Represents projects with nested board data and user information.

- `api/views.py`: API views implementing the business logic:
  - `ProjectViewSet`: Handles CRUD operations for projects with permission filtering.
  - `BoardViewSet`: Manages board creation and updates with proper permission checks.
  - `TaskViewSet`: Handles task operations with filtering based on user permissions.
  - Custom actions for analytics and member management.

- `api/consumers.py`: Contains the WebSocket consumer implementation:
  - `TaskConsumer`: Handles real-time task updates using WebSockets.
  - Methods for connecting to board-specific channels and broadcasting updates.

- `api/urls.py`: Defines API endpoints and routes using Django REST Framework's router.

- `api/admin.py`: Registers models with the Django admin interface for easy management.

- `api/apps.py`: Django app configuration for the API.

## Setup Instructions

### Prerequisites

- Python 3.8+
- pip (Python package manager)


### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/taskflow-management-system.git
   cd taskflow-management-system/backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   
4. Apply database migrations:
   ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

5. Create a superuser account:
    ```
   python manage.py createsuperuser
    ```
   
6. Run the development server:
    ```
   python manage.py runserver
    ```

7. Run the WebSocket server with Daphne:
    ```
   daphne -p 8001 taskflow.asgi:application
    ```

8. cd into the frontend directoryand run the frontend server:
    ```
   cd ../frontend
   npm install
   npm start
    ``` 
9. Open your browser and navigate to `http://localhost:3000/` to access the frontend. You can register a new account or use the superuser account created in step 5 to log in.

10. You could also access the Django admin interface at `http://localhost:8000/admin/` 

## API Documentation
### Authentication
All API endpoints except for token authentication require token-based authentication.
#### Get Authentication Token
- URL: `/api/token-auth/`
- Method: `POST`
- Body:
```
{
  "username": "your_username",
  "password": "your_password"
}
```
- Response:
```
{
  "token": "your_auth_token"
}
```
For all subsequent requests, include the token in the Authorization header:
```
Authorization: Token your_auth_token
```
### Authentication
#### List/Create Projects
- URL: `/api/projects/`
- Method: `GET` (List), `POST` (Create)
- Body (POST):
```
{
  "title": "New Project Name",
  "description": "Detailed project description goes here"
}
```
#### Retrieve/Update/Delete Project
- URL: `/api/projects/<project_id>/`
- Method: `GET` (Retrieve), `PUT` (Update), `DELETE` (Delete)
- Body (PUT):
```
{
  "title": "Updated Project Name",
  "description": "Updated project description"
}
```
#### Add Member to Project
- URL: `/api/projects/<project_id>/add_member/`
- Method: `POST`
- Body:
```
{
  "user_id": 2
}
```
#### Get Project Boards
- URL: `/api/projects/<project_id>/analytics/`
- Method: `GET`
- Response:
```
{
  "total_tasks": 25,
  "completed_tasks": 10,
  "in_progress": 8,
  "overdue": 3,
  "by_user": [
    {"assigned_to__username": "user1", "count": 12},
    {"assigned_to__username": "user2", "count": 13}
  ]
}
```
### Boards
#### List/Create Boards
- URL: `/api/boards/`
- Method: `GET` (List), `POST` (Create)
- Body (POST):
```
{
  "name": "Sprint Board",
  "project": 1
}
```
#### Retrieve/Update/Delete Board
- URL: `/api/boards/<board_id>/`
- Method: `GET` (Retrieve), `PUT` (Update), `DELETE` (Delete)

#### List/Create Tasks
- URL: `/api/tasks/`
- Method: `GET` (List), `POST` (Create)
- Body (POST):
```
{
  "title": "Implement Authentication",
  "description": "Create login and registration functionality",
  "status": "TODO",
  "priority": 2,
  "due_date": "2025-04-15T12:00:00Z",
  "assigned_to_id": 1,
  "board": 1
}
```
#### Retrieve/Update/Delete Task
- URL: `/api/tasks/<task_id>/`
- Method: `GET` (Retrieve), `PUT` (Update), `DELETE` (Delete)


## WebSocket Communication
TaskFlow implements real-time updates using WebSockets via Django Channels. This allows for instant task status updates across all connected clients.

### WebSocket Connection
- URL: `ws://localhost:8000/ws/boards/<board_id>/`
- Replace `<board_id>` with the actual board ID you want to connect to.

#### Sending Messages
- Send a JSON message to the WebSocket server to update task status:
```
{
  "type": "update_task",
  "task_id": 1,
  "status": "IN_PROGRESS"
}
```
#### - Valid status values:
- `TODO`: Task is planned but not started
- `IN_PROGRESS`: Task is actively being worked on
- `REVIEW`: Task is complete and awaiting review
- `DONE`: Task is completed and approved

#### - Priority Levels
- `1`: Low priority
- `2`: Medium priority
- `3`: High priority
- `4`: Urgent

#### Receiving Messages
When a task is updated, all clients connected to the same board will receive a message with the following format
```
{
  "type": "task_update",
  "task_id": 1,
  "action": "update_status",
  "status": "IN_PROGRESS"
}
```

#### Running the WebSocket Server
For development, you can use:
- Option 1: Run with Django's development server (recommended for development)
```
python manage.py runserver
``` 
- Option 2: Run with Daphne (standalone ASGI server)
```
daphne -p 8001 taskflow.asgi:application
```
## Testing with Postman
### 1. Install Postman: Download and install from [Postman](https://www.postman.com/downloads/)
### 2. Get the Authentication Token:
- Create a new POST request to `http://localhost:8000/api/token-auth/`
- select Body -> raw -> JSON
- Enter your credentials:
```
{
  "username": "your_username",
  "password": "your_password"
}
```
- Send the request and copy the token from the response.
### 3. Set Up Authentication:
- For all other requests, got to Headers
- Add a key `Authorization` with value `Token your_auth_token`

### 4. Testing Project Creation:
- Create a new POST request to `http://localhost:8000/api/projects/`
- Set the Authorization header
- Select Body -> raw -> JSON
- Enter the project details in the body:
```
{
  "title": "New Project Name",
  "description": "Detailed project description goes here"
}
```
- Send the request to create a new project.
### 5. Add a team member to the project:
- Create a new POST request to `http://localhost:8000/api/projects/<project_id>/add_member/`
- Set the Authorization header
- Select Body -> raw -> JSON
- Enter the user ID in the body:
```
{
  "user_id": 2
}
```
### 6. Create a Board:
- Create a new POST request to `http://localhost:8000/api/boards/`
- Set the Authorization header
- Select Body -> raw -> JSON
- Enter the board details in the body:
```
{
  "name": "Sprint Board",
  "project": 1
}
```
### 7. Create a Task:
- Create a new POST request to `http://localhost:8000/api/tasks/`
- Set the Authorization header
- Select Body -> raw -> JSON
- Enter the task details in the body:
```
{
  "title": "Design User Interface",
  "description": "Create wireframes and mockups",
  "status": "TODO",
  "priority": 1,
  "due_date": "2025-03-30T12:00:00Z",
  "assigned_to_id": 2,
  "board": 1
}
```
### 8. Testing WebSocket Communication:
- Open a new WebSocket connection in Postman and connects to `ws://localhost:8000/ws/boards/<board_id>/`
- Replace `<board_id>` with the actual board ID you want to connect to.
- Send a JSON message to the WebSocket server to update task status:
```
{
  "type": "update_task",
  "task_id": 1,
  "status": "IN_PROGRESS"
}
```
- Observe the message being broadcast back to all connected clients

## Project Structure
- api/models.py: Contains the data models for projects, boards, tasks, and team members.
- api/serializers.py: Serializers to convert model instances to JSON and vice versa.
- api/views.py: API views for handling CRUD operations on projects, boards, tasks, and team members.
- api/consumers.py: WebSocket consumer for handling real-time task updates.
- api/url.py: URL routing for API endpoints and WebSocket consumers.

## Security Considerations
- The system uses token-based authentication for API security
- Object-level permissions ensure users can only access their own projects or projects they're members of
- All API endpoints require authentication
- CORS is enabled for frontend integration

## Troubleshooting
### Common Issues:
#### 1. TokToken Authentication Error:
- Ensure 'rest_framework.authtoken' is in INSTALLED_APPS
- Run migrations again: python manage.py migrate
- Check that the token is correctly formatted in the header

#### 2. WebSocket Connection Issues:
- Ensure you're connecting to the correct URL with the proper board ID
- Check that the Django Channels setup is complete with the channel layers configured
- Run the server with daphne if WebSocket connections are failing with runserver