import React, { useEffect, useState } from "react";
import socketService from "./socketService";

const ChatPreview = ({ onClose, shareToken }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [inputRequest, setInputRequest] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // Статус соединения

  // Установить соединение при открытии чата
  useEffect(() => {
    socketService.connect(setConnectionStatus, setMessages);
    socketService.startBot(shareToken || "unprocessed");
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
    const getStatusIcon = () => {
      switch (connectionStatus) {
        case "connected":
          return "🟢";
        case "connecting":
          return "🟡";
        case "error":
        case "connect_error":
          return "🔴";
        case "disconnected":
          return "⚫";
        default:
          return "⚪";
      }
    };

    const getStatusText = () => {
      switch (connectionStatus) {
        case "error":
          return "Error during interpreter execution";
        case "connect_error":
          return "Connection error. Please try again.";
        case "reconnecting":
          return "Reconnecting...";
        case "reconnect_failed":
          return "Failed to reconnect. Please try later.";
        case "disconnected":
          return "Chat ended";
        case "connecting":
          return "Connecting to bot...";
        case "connected":
          return "Connected to bot";
        default:
          return "Unknown status";
      }
    };

    if (connectionStatus === "connected" && messages.length > 0) {
      return null; // Don't show status when connected and have messages
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "15px",
          margin: "10px 0",
          borderRadius: "10px",
          background:
            connectionStatus === "connected"
              ? "rgba(76, 175, 80, 0.1)"
              : connectionStatus === "error" ||
                connectionStatus === "connect_error"
              ? "rgba(244, 67, 54, 0.1)"
              : "rgba(255, 152, 0, 0.1)",
          border: `1px solid ${
            connectionStatus === "connected"
              ? "rgba(76, 175, 80, 0.3)"
              : connectionStatus === "error" ||
                connectionStatus === "connect_error"
              ? "rgba(244, 67, 54, 0.3)"
              : "rgba(255, 152, 0, 0.3)"
          }`,
          color:
            connectionStatus === "connected"
              ? "#4CAF50"
              : connectionStatus === "error" ||
                connectionStatus === "connect_error"
              ? "#F44336"
              : "#FF9800",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        <span style={{ fontSize: "16px" }}>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
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
        width: "350px",
        background: "linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.7)",
        borderLeft: "2px solid #7d3cff",
        zIndex: 1000,
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "15px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(125, 60, 255, 0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background:
                connectionStatus === "connected" ? "#4CAF50" : "#F44336",
              animation:
                connectionStatus === "connecting"
                  ? "pulse 1.5s infinite"
                  : "none",
            }}
          />
          <span style={{ fontWeight: "bold", fontSize: "16px" }}>Chat Bot</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.target.style.background = "rgba(255,255,255,0.2)")
          }
          onMouseLeave={(e) =>
            (e.target.style.background = "rgba(255,255,255,0.1)")
          }
        >
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flexGrow: 1,
          padding: "15px",
          overflowY: "auto",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        {messages.length === 0 && connectionStatus === "connected" && (
          <div
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.6)",
              marginTop: "50px",
              fontSize: "14px",
            }}
          >
            Start chatting with your bot...
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              margin: "12px 0",
              textAlign: msg.sender === "user" ? "right" : "left",
              animation: "fadeIn 0.3s ease-in",
            }}
          >
            <div
              style={{
                display: "inline-block",
                maxWidth: "80%",
                padding: "10px 15px",
                borderRadius: "15px",
                background:
                  msg.sender === "user"
                    ? "linear-gradient(135deg, #7d3cff 0%, #9c5fff 100%)"
                    : "rgba(255,255,255,0.1)",
                color: msg.sender === "user" ? "#fff" : "#fff",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                boxShadow:
                  msg.sender === "user"
                    ? "0 2px 8px rgba(125, 60, 255, 0.3)"
                    : "0 2px 8px rgba(0,0,0,0.2)",
                border:
                  msg.sender === "user"
                    ? "none"
                    : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {renderConnectionStatusMessage()}
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "15px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
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
            placeholder={
              inputRequest ? "Enter your response..." : "Type your message..."
            }
            style={{
              flexGrow: 1,
              padding: "12px 15px",
              borderRadius: "25px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.3s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#7d3cff")}
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.2)")
            }
          />
          <button
            onClick={handleSendMessage}
            disabled={input.trim() === ""}
            style={{
              padding: "12px 20px",
              background:
                input.trim() === ""
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(135deg, #7d3cff 0%, #9c5fff 100%)",
              border: "none",
              borderRadius: "25px",
              color: "#fff",
              cursor: input.trim() === "" ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              transition: "all 0.3s ease",
              minWidth: "80px",
            }}
            onMouseEnter={(e) => {
              if (input.trim() !== "") {
                e.target.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatPreview;
