const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
require("dotenv").config();
const port = process.env.PORT;

// socket io connection
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

// first route
app.get("/", (req, res) => {
  res.send("Data is working");
});
// setting the route
const userSocketMap = {}; //{userId with socketId}
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId !== "undefined") userSocketMap[userId] = socket.id;
  //  io.emit is used to send the events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // getting user messages
  socket.on("newMessages", (socketData) => {
    const { receiverAuthId, message } = socketData;
    const receiverSocketId = getReceiverSocketId(receiverAuthId);
    const senderSocketId = getReceiverSocketId(message.senderId.authId);
    if (receiverSocketId || senderSocketId) {
      io.to(receiverSocketId).emit("receive-message", message);
      io.to(senderSocketId).emit("receive-message", message);
    }
  });
  // getting the group message
  socket.on("groupMessages", (groupData) => {
    io.emit("receive-group-message", groupData);
  });
  // socket.on() is used to listen to the events. can be used both on client and server side
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

server.listen(port, () => {
  console.log(`Server is running on the port: ${port}`);
});
