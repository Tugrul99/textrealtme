import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import config from "../config";  // config.js'i içe aktar
import '../components/styles.css';

const SERVER_URL = config.SERVER_URL;  // Artık Render URL’sini alıyor

const getColorForUser = (username) => {
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#FFBD33"];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const TextEditor = () => {
  const [socket, setSocket] = useState(null);
  const [content, setContent] = useState("");
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const s = io(SERVER_URL);
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!socket || !username || !message.trim()) return;

    const newMessage = `[${username}]: ${message.trim()}`;
    const updatedContent = content ? `${content}\n${newMessage}` : newMessage;

    setContent(updatedContent);
    setMessage("");

    // Veritabanına kaydetmek için API çağrısı yapıyoruz
    fetch(`${SERVER_URL}/save-document`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            documentId: "default-document",
            content: updatedContent,
            username: username,
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log("Document saved successfully:", data);
    })
    .catch(error => {
        console.error("Error saving document:", error);
    });

    // Soket üzerinden diğer kullanıcılara güncellemeyi gönderiyoruz
    socket.emit("edit-document", {
        documentId: "default-document",
        content: updatedContent,
        username,
    });
  };

  return (
    <div className="editor-container">
      {!isEditing ? (
        <div className="username-container">
          <input
            type="text"
            className="username-input"
            placeholder="Enter your name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button className="start-button" onClick={() => setIsEditing(true)}>
            Start
          </button>
        </div>
      ) : (
        <>
          <div className="message-input-container">
            <input
              type="text"
              className="message-input"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="send-button" onClick={sendMessage}>
              Send
            </button>
          </div>

          <div className="text-display">
            {content.split("\n").map((line, index) => {
              const match = line.match(/^\[(.*?)\]: (.*)$/);
              if (match) {
                const username = match[1];
                const message = match[2];
                return (
                  <p key={index} style={{ color: getColorForUser(username) }}>
                    <strong>{username}:</strong> {message}
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
