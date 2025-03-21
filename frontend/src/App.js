import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {Container} from 'react-bootstrap';
import {AuthProvider, useAuth} from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Projects from './components/projects/Projects';
import Boards from './components/boards/Boards';
import Tasks from './components/tasks/Tasks';
import 'bootstrap/dist/css/bootstrap.min.css';


const ProtectedRoute = ({children}) => {
    const {user, loading} = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace/>;
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login/>}/>
            <Route
                path="/projects"
                element={
                    <ProtectedRoute>
                        <Projects/>
                    </ProtectedRoute>
                }
            />
            <Route path="/register" element={<Register/>}/>
            <Route
                path="/boards/:projectId"
                element={
                    <ProtectedRoute>
                        <Boards/>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/tasks/:boardId"
                element={
                    <ProtectedRoute>
                        <Tasks/>
                    </ProtectedRoute>
                }
            />
            <Route path="/" element={<Navigate to="/projects" replace/>}/>
        </Routes>
    );
};

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Container fluid className="p-0">
                    <AppRoutes/>
                </Container>
            </AuthProvider>
        </Router>
    );
};

export default App;