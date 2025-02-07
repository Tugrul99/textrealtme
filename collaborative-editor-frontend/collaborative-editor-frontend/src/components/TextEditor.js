import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SERVER_URL } from "../config"; // Environment variable'dan alınacak

const TextEditor = () => {
  const [socket, setSocket] = useState(null);
  const [content, setContent] = useState("");
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  // Renk üretme fonksiyonu
  const getColorForUser = (username) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    // WebSocket bağlantısı
    const s = io(SERVER_URL, {
      withCredentials: true,
      transports: ['websocket']
    });

    s.on("update-document", (content) => {
      setContent(content);
    });

    setSocket(s);

    return () => s.disconnect();
  }, []);

  const sendMessage = () => {
    if (!socket || !username || !message.trim()) return;

    const newMessage = `[${username}]: ${message.trim()}`;
    const updatedContent = content ? `${content}\n${newMessage}` : newMessage;

    // Soket üzerinden gönder
    socket.emit("edit-document", {
      documentId: "default-document",
      content: updatedContent,
      username
    });

    setMessage("");
  };

  return (
    <div className="editor-container">
      {!isEditing ? (
        <div className="username-container">
          <input
            type="text"
            placeholder="Kullanıcı adınız..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="username-input"
          />
          <button 
            className="start-button"
            onClick={() => setIsEditing(true)}
            disabled={!username.trim()}
          >
            Başla
          </button>
        </div>
      ) : (
        <>
          <div className="message-input-container">
            <input
              type="text"
              placeholder="Mesajınız..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="message-input"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              className="send-button"
              onClick={sendMessage}
              disabled={!message.trim()}
            >
              Gönder
            </button>
          </div>

          <div className="text-display">
            {content.split("\n").map((line, index) => {
              const match = line.match(/^\[(.*?)\]: (.*)$/);
              if (match) {
                const [_, user, msg] = match;
                return (
                  <p key={index} style={{ color: getColorForUser(user) }}>
                    <strong>{user}:</strong> {msg}
                  </p>
                );
              }
              return <p key={index}>{line}</p>;
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TextEditor;