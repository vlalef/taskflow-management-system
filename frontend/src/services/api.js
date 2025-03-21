import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('Token in interceptor:', token);
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const login = async (username, password) => {
    const response = await apiClient.post('/token-auth/', {username, password});
    return response.data;
};

export const getProjects = async () => {
    const response = await apiClient.get('/projects/');
    return response.data;
};

export const getBoards = async (projectId) => {
    const response = await apiClient.get(`/boards/?project=${projectId}`);
    return response.data;
};

export const getTasks = async (boardId) => {
    const response = await apiClient.get(`/tasks/?board=${boardId}`);
    return response.data;
};

export default apiClient;