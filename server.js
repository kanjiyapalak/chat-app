const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.static(path.join(__dirname, "public")));

const rooms = {};

function updateParticipants(roomCode) {
  const userList = rooms[roomCode]?.users || [];
  io.to(roomCode).emit("updateParticipants", userList);
}

io.on("connection", (socket) => {
  console.log("New connection");

  // Create a room
  socket.on("createRoom", (username) => {
    const roomCode = uuidv4().slice(0, 6);
    rooms[roomCode] = { users: [username] };

    socket.join(roomCode);
    socket.username = username;
    socket.room = roomCode;

    socket.emit("roomCreated", roomCode);
    io.to(roomCode).emit("message", {
      username: "",
      text: `${username} created and joined the room.`,
    });
    updateParticipants(roomCode);
  });

  // Join an existing room
  socket.on("joinRoom", ({ username, roomCode }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].users.push(username);

      socket.join(roomCode);
      socket.username = username;
      socket.room = roomCode;

      socket.emit("joinedRoom", roomCode);
      io.to(roomCode).emit("message", {
        username: "",
        text: `${username} has joined the room.`,
      });
      updateParticipants(roomCode);
    } else {
      socket.emit("errorMessage", "Room not found.");
    }
  });

  // Chat message
  socket.on("chatMessage", (msg) => {
    io.to(socket.room).emit("message", {
      username: socket.username,
      text: msg,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (socket.username && socket.room) {
      const room = rooms[socket.room];
      if (room) {
        room.users = room.users.filter((user) => user !== socket.username);
        io.to(socket.room).emit("message", {
          username: "",
          text: `${socket.username} has left the chat.`,
        });
        updateParticipants(socket.room);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
