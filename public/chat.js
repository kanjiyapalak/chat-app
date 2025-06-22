document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (!token || !username) {
        window.location.href = '/index.html';
        return;
    }

    // Get room code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (!roomCode) {
        window.location.href = '/home.html';
        return;
    }

    // Update room title
    document.getElementById('roomTitle').textContent = `Room: ${roomCode}`;

    // Connect to Socket.IO server
    const socket = io({
        auth: {
            token,
            username
        }
    });

    // Join room
    socket.emit('joinRoom', { roomCode, username });

    // Handle incoming messages
    socket.on('message', (message) => {
        displayMessage(message);
    });

    // Handle room history
    socket.on('roomHistory', (messages) => {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = ''; // Clear existing messages
        messages.forEach(message => displayMessage(message));
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        alert(error.message);
    });

    // Handle room leave
    socket.on('roomLeft', () => {
        window.location.href = '/home.html';
    });

    // Handle user joined notification
    socket.on('userJoined', (username) => {
        displaySystemMessage(`${username} joined the room`);
    });

    // Handle user left notification
    socket.on('userLeft', (username) => {
        displaySystemMessage(`${username} left the room`);
    });

    // Handle participants list
    socket.on('participantsList', (participants) => {
        // Ensure the current user is in the list
        if (!participants.includes(username)) {
            participants.push(username);
        }
        updateParticipantsList(participants);
    });

    // Request initial participants list
    socket.emit('getParticipants', { roomCode });

    // Hamburger menu logic for responsive navbar
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (hamburgerBtn && dropdownMenu) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click from immediately closing it
            dropdownMenu.classList.toggle('show');
        });
        // Hide menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburgerBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
});

function displayMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement("div");
    messageDiv.className = "message";
    
    const isCurrentUser = message.sender === localStorage.getItem('username');
    messageDiv.classList.add(isCurrentUser ? 'sent' : 'received');

    // Always show username
    const senderSpan = document.createElement("span");
    senderSpan.className = "sender";
    senderSpan.textContent = message.sender;
    messageDiv.appendChild(senderSpan);

    // Message content row (content + time)
    const contentRow = document.createElement("div");
    contentRow.className = "message-content-row";

    const contentSpan = document.createElement("span");
    contentSpan.className = "content";
    contentSpan.textContent = message.content;

    const timeSpan = document.createElement("span");
    timeSpan.className = "time";
    const messageTime = new Date(message.timestamp);
    timeSpan.textContent = messageTime.toLocaleTimeString();

    contentRow.appendChild(contentSpan);
    contentRow.appendChild(timeSpan);

    messageDiv.appendChild(contentRow);

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function displaySystemMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system');
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message) {
        const socket = io({
            auth: {
                token: localStorage.getItem('token'),
                username: localStorage.getItem('username')
            }
        });
        
        socket.emit('sendMessage', {
            content: message,
            roomCode: new URLSearchParams(window.location.search).get('room')
        });
        messageInput.value = '';
    }
}

function goBack() {
    window.location.href = '/home.html';
}

function showParticipants() {
    const roomCode = new URLSearchParams(window.location.search).get('room');
    window.location.href = `/participants.html?room=${roomCode}`;
}

function leaveRoom() {
    if (!confirm("Are you sure you want to leave the room?")) {
        return; // User cancelled
    }
    const socket = io({
        auth: {
            token: localStorage.getItem('token'),
            username: localStorage.getItem('username')
        }
    });
    
    socket.emit('leaveRoom', {
        roomCode: new URLSearchParams(window.location.search).get('room')
    });
    window.location.href = '/home.html';
}

// Handle Enter key in message input
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Update participants list
function updateParticipantsList(participants) {
    const participantsList = document.getElementById('participantsList');
    if (!participantsList) return;
    
    participantsList.innerHTML = '';
    participants.forEach(participant => {
        const li = document.createElement('li');
        li.textContent = participant;
        // Highlight current user
        if (participant === localStorage.getItem('username')) {
            li.classList.add('current-user');
        }
        participantsList.appendChild(li);
    });
}

// Add logout function
function logout() {
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/index.html';
    })
    .catch(error => {
        console.error('Error:', error);
    });
} 