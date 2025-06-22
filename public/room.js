document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    const createRoomBtn = document.getElementById('createRoom');
    const joinRoomBtn = document.getElementById('joinRoom');
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const joinRoomForm = document.getElementById('joinRoomForm');

    createRoomBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                document.getElementById('roomCode').textContent = data.roomCode;
                roomCodeDisplay.style.display = 'block';
                joinRoomForm.style.display = 'none';
            } else {
                alert(data.message || 'Failed to create room');
            }
        } catch (error) {
            console.error('Create room error:', error);
            alert('An error occurred while creating the room');
        }
    });

    joinRoomBtn.addEventListener('click', () => {
        roomCodeDisplay.style.display = 'none';
        joinRoomForm.style.display = 'block';
    });
});

function copyRoomCode() {
    const roomCode = document.getElementById('roomCode').textContent;
    navigator.clipboard.writeText(roomCode)
        .then(() => alert('Room code copied to clipboard!'))
        .catch(err => console.error('Failed to copy room code:', err));
}

async function joinRoom() {
    const roomCode = document.getElementById('roomCodeInput').value;
    const token = localStorage.getItem('token');

    if (!roomCode) {
        alert('Please enter a room code');
        return;
    }

    try {
        const response = await fetch('/api/rooms/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ roomCode })
        });

        const data = await response.json();
        if (response.ok) {
            window.location.href = `/chat.html?room=${roomCode}`;
        } else {
            alert(data.message || 'Failed to join room');
        }
    } catch (error) {
        console.error('Join room error:', error);
        alert('An error occurred while joining the room');
    }
} 