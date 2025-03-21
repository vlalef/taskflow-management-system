import React, {useState, useEffect} from 'react';
import {Container, Row, Col, Card, Button, Form, Alert, Spinner} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';

function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/projects/', {
                headers: {Authorization: `Token ${localStorage.getItem('token')}`}
            });
            setProjects(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch projects. ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                'http://localhost:8000/api/projects/',
                {title, description},
                {headers: {Authorization: `Token ${localStorage.getItem('token')}`}}
            );
            setProjects([...projects, response.data]);
            setShowForm(false);
            setTitle('');
            setDescription('');
        } catch (err) {
            setError('Failed to create project. ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleProjectClick = (projectId) => {
        navigate(`/boards/${projectId}`);
    };

    if (loading && projects.length === 0) {
        return (
            <Container className="d-flex justify-content-center mt-5">
                <Spinner animation="border"/>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Row className="mb-4">
                <Col>
                    <h2>My Projects</h2>
                </Col>
                <Col className="text-end">
                    <Button onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : 'New Project'}
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {showForm && (
                <Card className="mb-4">
                    <Card.Body>
                        <Form onSubmit={handleCreateProject}>
                            <Form.Group className="mb-3">
                                <Form.Label>Project Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter project title"
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
                                    placeholder="Enter project description"
                                />
                            </Form.Group>

                            <Button type="submit" variant="primary">Create Project</Button>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            <Row>
                {projects.length === 0 && !loading ? (
                    <Col>
                        <Alert variant="info">
                            No projects found. Create your first project to get started!
                        </Alert>
                    </Col>
                ) : (
                    projects.map(project => (
                        <Col md={4} className="mb-4" key={project.id}>
                            <Card className="h-100 shadow-sm" onClick={() => handleProjectClick(project.id)}
                                  style={{cursor: 'pointer'}}>
                                <Card.Body>
                                    <Card.Title>{project.title}</Card.Title>
                                    <Card.Text>{project.description || 'No description provided'}</Card.Text>
                                </Card.Body>
                                <Card.Footer className="bg-white">
                                    <small className="text-muted">
                                        {project.boards?.length || 0} boards • Owner: {project.owner?.username}
                                    </small>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))
                )}
            </Row>
        </Container>
    );
}

export default Projects;