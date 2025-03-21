import React, {useState, useEffect, useRef} from 'react';
import {Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge} from 'react-bootstrap';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [boardDetails, setBoardDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('TODO');
    const [priority, setPriority] = useState(1);
    const [dueDate, setDueDate] = useState('');
    const [wsConnected, setWsConnected] = useState(false);
    const {boardId} = useParams();
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        fetchBoardAndTasks();
        setupWebSocket();

        return () => {
            cleanupWebSocket();
        };
    }, [boardId]);

    const cleanupWebSocket = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current) {
            if (socketRef.current.readyState === WebSocket.OPEN ||
                socketRef.current.readyState === WebSocket.CONNECTING) {
                socketRef.current.close();
            }
            socketRef.current = null;
        }
    };


    const setupWebSocket = () => {
        cleanupWebSocket();

        try {
            console.log(`Connecting to WebSocket: ws://localhost:8001/ws/boards/${boardId}/`);

            const ws = new WebSocket(`ws://localhost:8001/ws/boards/${boardId}/`);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connection established successfully');
                setWsConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket message received:', data);
                    if (data.type === 'task_update') {
                        updateTaskInState(data.task_id, data.status);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            ws.onclose = (event) => {
                console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
                setWsConnected(false);

                if (socketRef.current) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect WebSocket...');
                        setupWebSocket();
                    }, 3000);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('WebSocket connection error. Try refreshing the page.');
            };
        } catch (err) {
            console.error('Error setting up WebSocket:', err);
            setError('Failed to establish WebSocket connection: ' + err.message);
        }
    };

    const updateTaskInState = (taskId, newStatus) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId ? {...task, status: newStatus} : task
            )
        );
    };

    const fetchBoardAndTasks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Authentication token not found. Please login again.');
                navigate('/login');
                return;
            }

            const boardResponse = await axios.get(`http://localhost:8000/api/boards/${boardId}/`, {
                headers: {Authorization: `Token ${token}`}
            });

            setBoardDetails(boardResponse.data);

            if (boardResponse.data.project) {
                if (typeof boardResponse.data.project === 'number') {
                    const projectResponse = await axios.get(`http://localhost:8000/api/projects/${boardResponse.data.project}/`, {
                        headers: {Authorization: `Token ${token}`}
                    });
                    setBoardDetails(prev => ({
                        ...prev,
                        project: projectResponse.data
                    }));
                }
            }

            setTasks(boardResponse.data.tasks || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch tasks: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const taskData = {
                title,
                description,
                status,
                priority: parseInt(priority),
                board: parseInt(boardId)
            };

            if (dueDate) {
                taskData.due_date = new Date(dueDate).toISOString();
            }

            const response = await axios.post(
                'http://localhost:8000/api/tasks/',
                taskData,
                {headers: {Authorization: `Token ${localStorage.getItem('token')}`}}
            );

            setTasks([...tasks, response.data]);
            setShowForm(false);
            resetForm();
        } catch (err) {
            setError('Failed to create task: ' + (err.response?.data?.detail || err.message));
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setStatus('TODO');
        setPriority(1);
        setDueDate('');
    };

    const updateTaskStatus = (taskId, newStatus) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.log('WebSocket not connected, attempting to reconnect...');
            setupWebSocket();
            setError('WebSocket connection not available. Trying to reconnect...');
            return;
        }

        try {
            console.log(`Sending task update: ${taskId} -> ${newStatus}`);
            socketRef.current.send(JSON.stringify({
                task_id: taskId,
                action: 'update_status',
                status: newStatus
            }));
        } catch (err) {
            console.error('Error sending WebSocket message:', err);
            setError('Failed to update task status: ' + err.message);
        }
    };


    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'TODO':
                return 'secondary';
            case 'IN_PROGRESS':
                return 'primary';
            case 'REVIEW':
                return 'warning';
            case 'DONE':
                return 'success';
            default:
                return 'light';
        }
    };

    const getPriorityBadgeVariant = (priority) => {
        switch (priority) {
            case 1:
                return 'info';
            case 2:
                return 'success';
            case 3:
                return 'warning';
            case 4:
                return 'danger';
            default:
                return 'light';
        }
    };

    const getStatusOptions = () => [
        {value: 'TODO', label: 'To Do'},
        {value: 'IN_PROGRESS', label: 'In Progress'},
        {value: 'REVIEW', label: 'Review'},
        {value: 'DONE', label: 'Done'}
    ];

    if (loading && !boardDetails) {
        return (
            <Container className="d-flex justify-content-center mt-5">
                <Spinner animation="border"/>
            </Container>
        );
    }
    console.log("ASDASDASDAD", boardDetails);

    return (
        <Container className="mt-4">
            <Row className="mb-4">
                <Col>
                    <h2>
                        {boardDetails?.name} Tasks
                    </h2>
                    <p className="text-muted">
                        Board in
                        project: {boardDetails && boardDetails.project && boardDetails.project.title ? boardDetails.project.title : 'Loading...'}
                    </p>
                </Col>
                <Col className="text-end">
                    <Button onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : 'New Task'}
                    </Button>
                </Col>
            </Row>


            {showForm && (
                <Card className="mb-4">
                    <Card.Body>
                        <Form onSubmit={handleCreateTask}>
                            <Form.Group className="mb-3">
                                <Form.Label>Task Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter task title"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter task description"
                                />
                            </Form.Group>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                        >
                                            {getStatusOptions().map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Priority (1-4)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            max="4"
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Due Date</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </Form.Group>

                            <Button type="submit" variant="primary">Create Task</Button>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            <Row>
                {tasks.length === 0 && !loading ? (
                    <Col>
                        <Alert variant="info">
                            No tasks found for this board. Create your first task to get started!
                        </Alert>
                    </Col>
                ) : (
                    <>
                        {getStatusOptions().map(statusOption => (
                            <Col md={3} key={statusOption.value}>
                                <Card className="mb-4 shadow-sm">
                                    <Card.Header className="bg-light">
                                        <h5>{statusOption.label}</h5>
                                    </Card.Header>
                                    <Card.Body style={{maxHeight: '500px', overflowY: 'auto'}}>
                                        {tasks.filter(task => task.status === statusOption.value).map(task => (
                                            <Card key={task.id} className="mb-2 task-card">
                                                <Card.Body>
                                                    <Card.Title>{task.title}</Card.Title>
                                                    <Card.Text>{task.description || 'No description'}</Card.Text>
                                                    <div className="d-flex justify-content-between">
                                                        <Badge bg={getPriorityBadgeVariant(task.priority)}>
                                                            Priority: {task.priority}
                                                        </Badge>
                                                        {task.due_date && (
                                                            <small className="text-muted">
                                                                Due: {new Date(task.due_date).toLocaleDateString()}
                                                            </small>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                                <Card.Footer>
                                                    <Form.Select
                                                        size="sm"
                                                        value={task.status}
                                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                                    >
                                                        {getStatusOptions().map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Card.Footer>
                                            </Card>
                                        ))}
                                        {tasks.filter(task => task.status === statusOption.value).length === 0 && (
                                            <p className="text-center text-muted">No tasks</p>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </>
                )}
            </Row>
        </Container>
    );
}

export default Tasks;