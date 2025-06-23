import React, { useEffect, useState } from "react";
import socketService from "./socketService";

const ChatPreview = ({ onClose, projectId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [inputRequest, setInputRequest] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [botStatus, setBotStatus] = useState("active");
  const [errorPopup, setErrorPopup] = useState(null);

  // Установить соединение при открытии чата
  useEffect(() => {
    socketService.connect(setConnectionStatus, setMessages);
    if (projectId) {
      socketService.startBot(projectId);
    }
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

    // Обработчик ошибок (например, лимит итераций)
    if (socketService.socket) {
      socketService.socket.on("error", (error) => {
        if (
          typeof error === "string" &&
          (error.includes("предел итераций") || error.includes("цикл"))
        ) {
          setErrorPopup(
            "Достигнут предел итераций (возможен цикл в логике бота). Исполнение остановлено."
          );
        }
      });
    }

    // Очистить соединение при закрытии
    return () => {
      socketService.disconnect();
      console.log("Bot stopped");
    };
  }, [projectId]);

  // Отправить сообщение
  const handleSendMessage = () => {
    if (input.trim() === "") {
      console.warn("Пустое сообщение не будет отправлено.");
      return;
    }

    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    if (inputRequest) {
      socketService.sendInputResponse(input.trim());
      setInputRequest(null);
    } else {
      socketService.sendMessage(input.trim());
      
      // Обновляем статус бота при командах
      if (input.trim().startsWith('/')) {
        if (input.trim() === '/stop') {
          setBotStatus("stopped");
        } else if (input.trim() === '/restart') {
          setBotStatus("active");
        }
      }
    }

    setInput("");
  };

  const renderConnectionStatusMessage = () => {
    switch (connectionStatus) {
      case "error":
        return <div style={{color: "red", marginTop: "20px"}}>Ошибка во время исполнения интерпретатора.</div>;
      case "connect_error":
        return <div style={{color: "red", marginTop: "20px"}}>Ошибка подключения. Попробуйте снова.</div>;
      case "reconnecting":
        return <div style={{color: "gray", marginTop: "20px"}}>Попытка переподключения...</div>;
      case "reconnect_failed":
        return <div style={{color: "gray", marginTop: "20px"}}>Не удалось переподключиться. Попробуйте позже.</div>;
      case "disconnected":
        return <div style={{color: "gray", marginTop: "20px"}}>Чат завершён.</div>;
      default:
        return null;
    }
  };

  const renderBotStatus = () => {
    const statusColor = botStatus === "active" ? "#4CAF50" : "#f44336";
    const statusText = botStatus === "active" ? "Активен" : "Остановлен";
    
    return (
      <div style={{
        padding: "8px 12px",
        backgroundColor: statusColor,
        color: "white",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
        marginBottom: "10px"
      }}>
        Статус бота: {statusText}
      </div>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: "300px",
        background: "rgba(30,30,30, 0.95)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Всплывающее окно ошибки цикла */}
      {errorPopup && (
        <div style={{
          position: "absolute",
          top: 60,
          left: 20,
          right: 20,
          zIndex: 999,
          background: "#ff4444",
          color: "#fff",
          padding: "16px 12px",
          borderRadius: 8,
          fontWeight: "bold",
          boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}>
          {errorPopup}
          <button
            style={{
              marginLeft: 16,
              background: "#fff",
              color: "#ff4444",
              border: "none",
              borderRadius: 4,
              padding: "4px 10px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => setErrorPopup(null)}
          >
            Закрыть
          </button>
        </div>
      )}
      <div
        style={{
          padding: "10px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Чат-бот</h3>
          <button
            onClick={onClose}
            style={{
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
        {renderBotStatus()}
      </div>

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
                whiteSpace: "pre-wrap",
                maxWidth: "80%",
                wordWrap: "break-word",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        {renderConnectionStatusMessage()}
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
          placeholder="Напиши сообщение или команду (/help)..."
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
    </div>
  );
};

export default ChatPreview;
