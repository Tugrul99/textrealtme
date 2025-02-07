const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const Document = require('./models/Document');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

// CORS Ayarları (Sadece Frontend URL'sine izin ver)
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB'ye bağlandı!"))
.catch(err => console.error("❌ MongoDB bağlantı hatası:", err));

// Socket.io Ayarları
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    transports: ['websocket'], // Render WebSocket desteği için
    credentials: true
  }
});

// Socket.io Logic (Önceki kodunuz aynı kalacak)
io.on("connection", (socket) => {
  console.log("🔗 Yeni kullanıcı bağlandı:", socket.id);

  socket.on("join-document", async ({ documentId, username }) => {
    // ... Önceki kodunuz ...
  });

  socket.on("edit-document", async ({ documentId, content, username }) => {
    // ... Önceki kodunuz ...
  });
});

// API Routes
app.use("/documents", documentRoutes);

// Sunucuyu Başlat
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`));