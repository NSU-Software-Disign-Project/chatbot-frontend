import React, { useEffect, useState } from "react";
import socketService from "./socketService";

const ChatPreview = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Установить соединение при открытии чата
  useEffect(() => {
    socketService.connect();
    socketService.startBot();
    console.log("Bot started");

    // Обработчик входящих сообщений
    socketService.onMessage((message) => {
      const serverMessage = { sender: "server", text: message };
      setMessages((prevMessages) => [...prevMessages, serverMessage]);
    });

    // Очистить соединение при закрытии
    return () => {
      socketService.disconnect();
      console.log("Bot stopped");
    };
  }, []);

  // Отправить сообщение
  const handleSendMessage = () => {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    socketService.sendMessage(input.trim()); // Отправка сообщения на сервер
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
      {/* Список сообщений */}
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

      {/* Поле ввода */}
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

      {/* Кнопка закрытия */}
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
