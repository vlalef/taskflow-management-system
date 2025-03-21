class WebSocketService {
    constructor() {
        this.callbacks = {};
        this.socket = null;
        this.connected = false;
    }

    connect(boardId) {
        if (this.socket && this.connected) {
            this.disconnect();
        }

        this.socket = new WebSocket(`ws://localhost:8000/ws/boards/${boardId}/`);

        this.socket.onopen = () => {
            console.log('WebSocket connection established');
            this.connected = true;
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (this.callbacks['message']) {
                this.callbacks['message'].forEach(callback => callback(data));
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
            this.connected = false;
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.connected = false;
        }
    }

    send(message) {
        if (this.socket && this.connected) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error('WebSocket not connected');
        }
    }

    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }
}

// Singleton instance of WebSocketService
const webSocketService = new WebSocketService();

export default webSocketService;