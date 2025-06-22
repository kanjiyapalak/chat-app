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

    // Connect to Socket.IO server
    const socket = io({
        auth: {
            token,
            username
        }
    });

    // Request participants list ONCE
    socket.emit('getParticipants', { roomCode });

    // Handle participants list ONCE
    socket.on('participantsList', (participants) => {
        const participantsList = document.getElementById('participantsList');
        if (!participantsList) return;

        participantsList.innerHTML = '';

        // Sort participants to keep current user at top
        participants.sort((a, b) => {
            if (a === username) return -1;
            if (b === username) return 1;
            return a.localeCompare(b);
        });

        participants.forEach(participant => {
            const participantElement = document.createElement('div');
            participantElement.classList.add('participant');

            // Add avatar
            const avatar = document.createElement('div');
            avatar.classList.add('participant-avatar');
           // avatar.textContent = participant.charAt(0).toUpperCase();

            // Add name
            const name = document.createElement('div');
            name.classList.add('participant-name');
            name.textContent = participant;

            // Add current user indicator
            if (participant === username) {
                participantElement.classList.add('current-user');
                name.textContent += ' (You)';
            }

            participantElement.appendChild(avatar);
            participantElement.appendChild(name);
            participantsList.appendChild(participantElement);
        });

        // Disconnect socket after getting the list (optional, for cleanliness)
        socket.disconnect();
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        alert(error.message);
    });
});

function goBackToChat() {
    const roomCode = new URLSearchParams(window.location.search).get('room');
    window.location.replace(`/chat.html?room=${roomCode}`);
} 