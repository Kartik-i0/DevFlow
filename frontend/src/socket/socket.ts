import {io} from 'socket.io-client'

// Create persistent socket connection pointing to Express backend
const socket = io('http://localhost:5000', {
    autoConnect: false // Prevents connecting until user logs in
});

export default socket;
