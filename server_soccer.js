// server.js

const express = require("express");
const fs = require("fs");
const https = require("https");
const socketIo = require("socket.io");

const app = express();

// SSLオプションの設定（key, certを用意）
const options = {
  key: fs.readFileSync("ssl/key.pem"),
  cert: fs.readFileSync("ssl/cert.pem")
};

const server = https.createServer(options, app);
const io = socketIo(server);

app.use(express.static("public")); // publicフォルダ内のファイルを提供

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on("send_my_pos", (data) => {
    console.log(`Received send_my_pos from ${socket.id}`);
    socket.broadcast.emit("update_your_pos", [
      socket.id,
      data[0], // color
      data[1], // name
      data[2], // position
      data[3], // quaternion
    ]);
  });

  socket.on("expressionUpdate", (data) => {
    try {
      if (data && typeof data.expression === "string" && data.id) {
        console.log(`Received expressionUpdate from ${socket.id}:`, data);
        socket.broadcast.emit("update_expression", data);
      } else {
        console.warn("Invalid expressionUpdate data received:", data);
      }
    } catch (error) {
      console.error("Error handling expressionUpdate:", error);
    }
  });

  // ヘッドポーズとモーション状態を受信
  socket.on("send_head_pose", (data) => {
    // data: { id, yaw, pitch, roll, motion }
    socket.broadcast.emit("update_head_pose", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    socket.broadcast.emit("remove_user", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTPS Server is running on https://localhost:${PORT}`);
});
