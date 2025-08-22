const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.static(path.join(__dirname, "public")));

// Middleware
app.use(express.json());
app.use(cookieParser());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chat-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// JWT Secret
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });
        
        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

// Check authentication middleware for HTML pages
const checkAuth = (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.redirect('/login.html');
    }
    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        res.redirect('/login.html');
    }
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Protected routes
app.get('/index.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/participants.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'participants.html'));
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        
        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

app.post('/api/rooms/create', auth, async (req, res) => {
    try {
        // Generate a unique room code and ensure no collision
        let roomCode;
        for (let i = 0; i < 5; i++) {
            roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const exists = await Room.findOne({ roomCode });
            if (!exists) break;
            roomCode = undefined;
        }
        if (!roomCode) {
            return res.status(500).json({ message: 'Failed to generate unique room code' });
        }

        const room = new Room({ roomCode, createdBy: req.user._id });
        await room.save();
        res.json({ roomCode, roomId: room._id });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ message: 'Error creating room' });
    }
});

app.post('/api/rooms/join', auth, async (req, res) => {
    try {
        let { roomCode } = req.body;
        if (!roomCode || typeof roomCode !== 'string') {
            return res.status(400).json({ message: 'Room code is required' });
        }
        roomCode = roomCode.trim().toUpperCase();

        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json({ message: 'Joined room successfully', roomCode, roomId: room._id });
    } catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({ message: 'Error joining room' });
    }
});

// Logout route
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Socket.IO connection handling
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.userId;
        socket.username = socket.handshake.auth.username;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// Store active rooms and their users
const rooms = new Map();
// Track disconnect timeouts for users
const disconnectTimeouts = new Map();

io.on("connection", (socket) => {
    console.log("New connection");

    // Get participants list
    socket.on('getParticipants', ({ roomCode }) => {
        if (rooms.has(roomCode)) {
            const participants = Array.from(rooms.get(roomCode));
            socket.emit('participantsList', participants);
        }
    });

    // Join an existing room
    socket.on("joinRoom", async ({ roomCode, username }) => {
        try {
            // Cancel any pending disconnect removal for this user
            const disconnectKey = `${roomCode}:${username}`;
            if (disconnectTimeouts.has(disconnectKey)) {
                clearTimeout(disconnectTimeouts.get(disconnectKey));
                disconnectTimeouts.delete(disconnectKey);
            }

            // Join socket room
            socket.join(roomCode);
            socket.room = roomCode;
            socket.username = username;
            
            // Add user to room
            if (!rooms.has(roomCode)) {
                rooms.set(roomCode, new Set());
            }
            rooms.get(roomCode).add(username);

            // Get room history
            const messages = await Message.find({ roomId: roomCode })
                .sort({ timestamp: 1 })
                .limit(50);
            
            socket.emit('roomHistory', messages);
            
            // Notify others
            socket.to(roomCode).emit('userJoined', username);
            
            // Send updated participants list to all users in the room
            const participants = Array.from(rooms.get(roomCode));
            io.to(roomCode).emit('participantsList', participants);
        } catch (error) {
            socket.emit('error', { message: 'Error joining room' });
        }
    });

    // Chat message
    socket.on("sendMessage", async ({ content, roomCode }) => {
        try {
            const message = new Message({
                roomId: roomCode,
                sender: socket.username,
                content,
                timestamp: new Date()
            });

            await message.save();
            
            io.to(roomCode).emit('message', message);
        } catch (error) {
            socket.emit('error', { message: 'Error sending message' });
        }
    });

    // Leave room
    socket.on("leaveRoom", ({ roomCode }) => {
        if (rooms.has(roomCode)) {
            rooms.get(roomCode).delete(socket.username);
            if (rooms.get(roomCode).size === 0) {
                rooms.delete(roomCode);
            } else {
                // Send updated participants list to remaining users
                const participants = Array.from(rooms.get(roomCode));
                io.to(roomCode).emit('participantsList', participants);
            }
        }
        
        socket.leave(roomCode);
        socket.to(roomCode).emit('userLeft', socket.username);
        socket.emit('roomLeft');
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        if (socket.room && socket.username) {
            const roomCode = socket.room;
            const username = socket.username;
            const disconnectKey = `${roomCode}:${username}`;
            // Wait 5 seconds before removing the user from the room
            const timeout = setTimeout(() => {
                if (rooms.has(roomCode)) {
                    rooms.get(roomCode).delete(username);
                    if (rooms.get(roomCode).size === 0) {
                        rooms.delete(roomCode);
                    } else {
                        // Send updated participants list to remaining users
                        const participants = Array.from(rooms.get(roomCode));
                        io.to(roomCode).emit('participantsList', participants);
                    }
                }
                io.to(roomCode).emit('userLeft', username);
                disconnectTimeouts.delete(disconnectKey);
            }, 5000); // 5 seconds
            disconnectTimeouts.set(disconnectKey, timeout);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
