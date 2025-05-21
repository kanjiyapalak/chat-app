const socket = io();

const createForm = document.getElementById("create-form");
const joinForm = document.getElementById("join-form");
const joinContainer = document.getElementById("join-container");
const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const input = document.getElementById("m");
const messages = document.getElementById("messages");
const participantsList = document.getElementById("participants");

let username = "";
let roomCode = "";

// Handle room creation
createForm.addEventListener("submit", (e) => {
  e.preventDefault();
  username = document.getElementById("create-username").value.trim();
  if (username) {
    socket.emit("createRoom", username);
  }
});

// Handle room join
joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  username = document.getElementById("username").value.trim();
  roomCode = document.getElementById("room-code").value.trim();

  if (username && roomCode) {
    socket.emit("joinRoom", { username, roomCode });
  }
});

// When room is created
socket.on("roomCreated", (code) => {
  roomCode = code;
  alert(`Room created! Share this code: ${code}`);
  joinContainer.classList.add("hidden");
  chatContainer.classList.remove("hidden");
});

// When room is joined
socket.on("joinedRoom", (code) => {
  roomCode = code;
  joinContainer.classList.add("hidden");
  chatContainer.classList.remove("hidden");
});

// Error message
socket.on("errorMessage", (msg) => {
  alert(msg);
});

// Chat message received
socket.on("message", (data) => {
  const li = document.createElement("li");
  li.textContent = `${data.username}: ${data.text}`;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});

// Participants list update
socket.on("updateParticipants", (participants) => {
  participantsList.innerHTML = "";
  participants.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    participantsList.appendChild(li);
  });
});

// Send chat message
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit("chatMessage", input.value);
    input.value = "";
  }
});

// ... other code above remains unchanged ...
const toggleBtn = document.getElementById("toggle-participants");
const participantsContainer = document.getElementById("participants-container");

toggleBtn.addEventListener("click", () => {
  participantsContainer.classList.toggle("hidden");
  toggleBtn.textContent = participantsContainer.classList.contains("hidden")
    ? "Show Participants"
    : "Hide Participants";
});


