import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const ChatPreview = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log("Чат открывается, пытаемся подключиться к WebSocket...");

    const newSocket = io("http://localhost:8080", {
      transports: ["websocket"], // Используем WebSocket
      reconnectionAttempts: 3, // Пробуем подключиться 3 раза
      timeout: 10000, // Таймаут на подключение 10 секунд
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Подключение установлено к серверу WebSocket!");
    });

    newSocket.on("connect_error", (err) => {
      console.error("Ошибка при подключении WebSocket:", err);
    });

    newSocket.on("connect_timeout", () => {
      console.error("Таймаут подключения WebSocket!");
    });

    // Логирование получения истории сообщений
    newSocket.on("start", (initialMessages) => {
      console.log("Получена история сообщений с сервера:", initialMessages);
      setMessages(initialMessages);
    });

    // Логирование получения нового сообщения от сервера
    newSocket.on("message", (newMessage) => {
      console.log("Получено новое сообщение от сервера:", newMessage);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "server", text: newMessage },
      ]);
    });

    newSocket.on("error", (err) => {
      console.error("Ошибка WebSocket:", err);
    });

    newSocket.on("disconnect", () => {
      console.log("Соединение WebSocket было закрыто.");
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log(`Попытка №${attemptNumber} переподключиться к WebSocket...`);
    });

    newSocket.on("reconnect_error", (err) => {
      console.error("Ошибка при переподключении WebSocket:", err);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Не удалось переподключиться к WebSocket.");
    });

    return () => {
      console.log("Закрываем соединение WebSocket...");
      newSocket.disconnect();
    };
  }, []);

  const handleSendMessage = () => {
    if (input.trim() === "") {
      console.warn("Пустое сообщение не будет отправлено.");
      return;
    }

    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    if (socket) {
      console.log("Отправляем сообщение на сервер:", input.trim());
      socket.emit("message", input.trim(), (response) => {
        if (response) {
          console.log("Сервер подтвердил получение сообщения:", response);
        } else {
          console.warn("Сервер не подтвердил получение сообщения.");
        }
      });
    } else {
      console.warn("Соединение WebSocket ещё не установлено.");
    }

    setInput("");
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: "300px",
        background: "rgba(30,30,30, 0.3)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div
        style={{
          flexGrow: 1,
          padding: "10px",
          overflowY: "auto",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              margin: "10px 0",
              textAlign: msg.sender === "user" ? "right" : "left",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "10px",
                background:
                  msg.sender === "user"
                    ? "rgb(70, 70, 255)"
                    : msg.sender === "server"
                    ? "rgb(70, 255, 70)"
                    : "rgb(50, 50, 50)",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          padding: "10px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши сообщение..."
          style={{
            flexGrow: 1,
            padding: "8px",
            borderRadius: "5px",
            border: "1px solid rgba(255,255,255,0.2)",
            marginRight: "10px",
            background: "rgb(20,20,20)",
            color: "#fff",
          }}
        />
        <button
          onClick={handleSendMessage}
          style={{
            padding: "8px 12px",
            background: "rgb(70, 70, 255)",
            border: "none",
            borderRadius: "5px",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Отправить
        </button>
      </div>

      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default ChatPreview;
