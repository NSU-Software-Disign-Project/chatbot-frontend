import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const ChatPreview = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // Статус соединения

  useEffect(() => {
    console.log("Чат открывается, пытаемся подключиться к WebSocket...");

    const newSocket = io("http://localhost:8080", {
      transports: ["websocket"], // Используем WebSocket
      reconnectionAttempts: 5, // Количество попыток переподключения
      reconnectionDelay: 3000, // Задержка между попытками переподключения (3 секунды)
      timeout: 10000, // Таймаут на подключение 10 секунд
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Подключение установлено к серверу WebSocket!");
      setConnectionStatus("connected");
    });

    newSocket.on("connect_error", (err) => {
      console.error("Ошибка при подключении WebSocket:", err);
      setConnectionStatus("error");
    });

    newSocket.on("connect_timeout", () => {
      console.error("Таймаут подключения WebSocket!");
      setConnectionStatus("timeout");
    });

    newSocket.on("start", (initialMessages) => {
      console.log("Получена история сообщений с сервера:", initialMessages);
      setMessages(initialMessages);
    });

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

    newSocket.on("reconnect", (attemptNumber) => {
      console.log(`Попытка №${attemptNumber} переподключиться к WebSocket...`);
      setConnectionStatus("reconnecting");
    });

    newSocket.on("reconnect_error", (err) => {
      console.error("Ошибка при переподключении WebSocket:", err);
      setConnectionStatus("reconnect_error");
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Не удалось переподключиться к WebSocket.");
      setConnectionStatus("reconnect_failed");
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
      let timeoutReached = false;

      const timer = setTimeout(() => {
        timeoutReached = true;
        console.warn("Сервер не ответил в течение 2 секунд.");
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: "Ответ от сервера не получен в течение 2 секунд." },
        ]);
      }, 2000);

      socket.emit("message", input.trim(), (response) => {
        if (!timeoutReached) {
          clearTimeout(timer);
          if (response) {
            console.log("Сервер подтвердил получение сообщения:", response);
          } else {
            console.warn("Сервер не подтвердил получение сообщения.");
          }
        }
      });
    } else {
      console.warn("Соединение WebSocket ещё не установлено.");
    }

    setInput("");
  };

  const renderConnectionStatusMessage = () => {
    switch (connectionStatus) {
      case "error":
        return <div style={{ color: "grey" }}>Ошибка подключения. Попробуйте снова.</div>;
      case "reconnecting":
        return <div style={{ color: "grey" }}>Попытка переподключения...</div>;
      case "reconnect_failed":
        return <div style={{ color: "grey" }}>Не удалось переподключиться. Попробуйте позже.</div>;
      case "disconnected":
        return <div style={{ color: "grey" }}>Соединение потеряно. Переподключитесь.</div>;
      default:
        return null;
    }
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
                    : msg.sender === "server" || msg.sender === "bot"
                    ? "#fff"
                    : "rgb(50, 50, 50)",
                color:
                  msg.sender === "server" || msg.sender === "bot"
                    ? "#000"
                    : "#fff",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        {renderConnectionStatusMessage()} {}
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage();
            }
          }}
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
