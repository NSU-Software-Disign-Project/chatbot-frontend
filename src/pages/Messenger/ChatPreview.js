import React, { useEffect, useState } from "react";
import socketService from "./socketService";

const ChatPreview = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [inputRequest, setInputRequest] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // Статус соединения

  // Установить соединение при открытии чата
  useEffect(() => {
    socketService.connect(setConnectionStatus, setMessages);
    socketService.startBot("unprocessed");
    console.log("Bot started");

    // Обработчик входящих сообщений
    socketService.onMessage((message) => {
      const serverMessage = { sender: "server", text: message };
      setMessages((prevMessages) => [...prevMessages, serverMessage]);
    });

    // Обработчик запроса ввода
    socketService.onRequestInput((prompt) => {
      const serverMessage = { sender: "server", text: prompt };
      setMessages((prevMessages) => [...prevMessages, serverMessage]);
      setInputRequest(prompt);
    });

    // Очистить соединение при закрытии
    return () => {
      socketService.disconnect();
      console.log("Bot stopped");
    };
  }, []);

  // Отправить сообщение
  const handleSendMessage = () => {
    if (input.trim() === "") {
      console.warn("Пустое сообщение не будет отправлено.");
      return;
    }

    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    if (inputRequest) {
      socketService.sendInputResponse(input.trim()); // Отправка ответа на запрос ввода
      setInputRequest(null);
    } else {
      socketService.sendMessage(input.trim()); // Отправка сообщения на сервер
    }

    setInput("");
  };

  const renderConnectionStatusMessage = () => {
    const statusStyle = { color: "red", marginTop: "20px" };
    switch (connectionStatus) {
      case "error":
        return <div style={statusStyle}>Ошибка подключения. Попробуйте снова.</div>;
      case "reconnecting":
        return <div style={statusStyle}>Попытка переподключения...</div>;
      case "reconnect_failed":
        return <div style={statusStyle}>Не удалось переподключиться. Попробуйте позже.</div>;
      case "disconnected":
        return <div style={statusStyle}>Соединение потеряно. Переподключитесь.</div>;
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
        {renderConnectionStatusMessage()} { }
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
