import React, {useState, useEffect} from 'react';
import {Container, Row, Col, Card, Button, Form, Alert, Spinner} from 'react-bootstrap';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';

function Boards() {
    const [boards, setBoards] = useState([]);
    const [projectDetails, setProjectDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [boardName, setBoardName] = useState('');
    const {projectId} = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjectAndBoards();
    }, [projectId]);

    const fetchProjectAndBoards = async () => {
        try {
            setLoading(true);

            const projectResponse = await axios.get(`http://localhost:8000/api/projects/${projectId}/`, {
                headers: {Authorization: `Token ${localStorage.getItem('token')}`}
            });

            setProjectDetails(projectResponse.data);
            setBoards(projectResponse.data.boards || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch boards. ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                'http://localhost:8000/api/boards/',
                {name: boardName, project: parseInt(projectId)},
                {headers: {Authorization: `Token ${localStorage.getItem('token')}`}}
            );
            setBoards([...boards, response.data]);
            setShowForm(false);
            setBoardName('');
        } catch (err) {
            setError('Failed to create board. ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleBoardClick = (boardId) => {
        navigate(`/tasks/${boardId}`);
    };

    if (loading && !projectDetails) {
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
                    <h2>
                        {projectDetails?.title} Boards
                    </h2>
                    <p className="text-muted">{projectDetails?.description}</p>
                </Col>
                <Col className="text-end">
                    <Button onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : 'New Board'}
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {showForm && (
                <Card className="mb-4">
                    <Card.Body>
                        <Form onSubmit={handleCreateBoard}>
                            <Form.Group className="mb-3">
                                <Form.Label>Board Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={boardName}
                                    onChange={(e) => setBoardName(e.target.value)}
                                    placeholder="Enter board name"
                                    required
                                />
                            </Form.Group>
                            <Button type="submit" variant="primary">Create Board</Button>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            <Row>
                {boards.length === 0 && !loading ? (
                    <Col>
                        <Alert variant="info">
                            No boards found for this project. Create your first board to get started!
                        </Alert>
                    </Col>
                ) : (
                    boards.map(board => (
                        <Col md={4} className="mb-4" key={board.id}>
                            <Card
                                className="h-100 shadow-sm"
                                onClick={() => handleBoardClick(board.id)}
                                style={{cursor: 'pointer'}}
                            >
                                <Card.Body>
                                    <Card.Title>{board.name}</Card.Title>
                                </Card.Body>
                                <Card.Footer className="bg-white">
                                    <small className="text-muted">
                                        {board.tasks?.length || 0} tasks
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

export default Boards;