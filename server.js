const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const Document = require('./models/Document');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

// CORS Ayarları
app.use(cors({
  origin: process.env.FRONTEND_URL, // Frontend URL'si
  credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

// MongoDB Bağlantısı (Deprecated options kaldırıldı)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB'ye bağlandı!"))
  .catch(err => console.error("❌ MongoDB bağlantı hatası:", err));

// Socket.io Ayarları
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    transports: ['websocket'], // Sadece WebSocket
    credentials: true
  }
});

// Socket.io Logic
io.on("connection", (socket) => {
  console.log("🔗 Yeni kullanıcı bağlandı:", socket.id);

  socket.on("join-document", async ({ documentId, username }) => {
    if (!username) {
      socket.emit("error", "Kullanıcı adı zorunludur!");
      return;
    }

    socket.join(documentId);
    console.log(`📄 Kullanıcı (${username}) belgeye katıldı.`);

    const document = await Document.findOne({ documentId });
    if (document) {
      socket.emit("load-document", document.content);
    } else {
      await Document.create({ documentId, content: "", changes: [] });
      socket.emit("load-document", "");
    }
  });

  socket.on("edit-document", async ({ documentId, content, username }) => {
    if (!username || !content.trim()) return;

    const timestamp = Date.now();
    const newEdit = { username, content, timestamp };

    let document = await Document.findOne({ documentId });

    if (!document) {
      document = await Document.create({
        documentId,
        changes: [newEdit],
        content
      });
    } else {
      document.changes.push(newEdit);
      document.changes.sort((a, b) => a.timestamp - b.timestamp);
      document.content = document.changes.map(edit => edit.content).join("\n");
      await document.save();
    }

    socket.to(documentId).emit("update-document", document.content);
  });
});

// API Routes
app.use("/documents", documentRoutes);

// Frontend'i Sun
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Sunucuyu Başlat
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`));