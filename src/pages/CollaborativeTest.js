import React, { useState, useEffect } from "react";
import { useCollaborativeEditing } from "../hooks/useCollaborativeEditing";
import CollaborativeEditingUI from "../components/CollaborativeEditingUI";
import UserManager from "../components/UserManager";

const CollaborativeTest = () => {
  const [userId, setUserId] = useState("user-1");
  const [projectId] = useState("test-project-123");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const {
    isConnected,
    connectionStatus,
    activeUsers,
    error,
    connect,
    disconnect,
    sendEditOperation,
  } = useCollaborativeEditing(projectId, userId);

  // Handle user change
  const handleUserChange = (newUserId) => {
    disconnect();
    setUserId(newUserId);
    setTimeout(() => {
      connect();
    }, 1000);
  };

  // Send test message
  const sendTestMessage = () => {
    if (inputMessage.trim()) {
      sendEditOperation("testMessage", {
        message: inputMessage,
        userId: userId,
        timestamp: new Date().toISOString(),
      });
      setInputMessage("");
    }
  };

  // Listen for edit operations
  useEffect(() => {
    const handleEditOperation = (operation) => {
      if (operation.type === "testMessage") {
        setMessages((prev) => [
          ...prev,
          {
            ...operation.data,
            id: Date.now() + Math.random(),
          },
        ]);
      }
    };

    // Set up the callback
    const service = require("../services/CollaborativeEditingService").default;
    service.onEditOperation(handleEditOperation);

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1e1e1e",
        color: "#fff",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "30px",
            color: "#7d3cff",
          }}
        >
          Collaborative Editing Test
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {/* Connection Status */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <h3>📡 Connection Status</h3>
            <p>
              Status:{" "}
              <span
                style={{
                  color: isConnected ? "#4CAF50" : "#F44336",
                  fontWeight: "bold",
                }}
              >
                {connectionStatus}
              </span>
            </p>
            <p>Project: {projectId}</p>
            <p>User: {userId}</p>
            <p>Active Users: {activeUsers.length}</p>
            {error && <p style={{ color: "#F44336" }}>Error: {error}</p>}
          </div>

          {/* Active Users */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <h3>👥 Active Users</h3>
            {activeUsers.length === 0 ? (
              <p style={{ color: "#888" }}>No other users connected</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {activeUsers.map((user, index) => (
                  <li
                    key={user.socketId}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background:
                          user.userId === userId ? "#4CAF50" : "#2196F3",
                      }}
                    ></span>
                    {user.userId === userId ? "You" : user.userId}
                    {user.userId === userId && (
                      <span style={{ fontSize: "12px", color: "#888" }}>
                        (current)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Test Messages */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            marginBottom: "30px",
          }}
        >
          <h3>Test Messages</h3>
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a test message..."
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                fontSize: "14px",
              }}
              onKeyPress={(e) => e.key === "Enter" && sendTestMessage()}
            />
            <button
              onClick={sendTestMessage}
              disabled={!isConnected}
              style={{
                padding: "10px 20px",
                borderRadius: "4px",
                border: "none",
                background: isConnected ? "#4CAF50" : "#666",
                color: "#fff",
                cursor: isConnected ? "pointer" : "not-allowed",
                fontSize: "14px",
              }}
            >
              Send
            </button>
          </div>

          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              padding: "10px",
            }}
          >
            {messages.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center" }}>
                No messages yet. Send a test message to see collaborative
                editing in action!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: "8px 12px",
                    margin: "4px 0",
                    background:
                      msg.userId === userId
                        ? "rgba(76, 175, 80, 0.2)"
                        : "rgba(33, 150, 243, 0.2)",
                    borderRadius: "4px",
                    borderLeft: `3px solid ${
                      msg.userId === userId ? "#4CAF50" : "#2196F3"
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      marginBottom: "4px",
                    }}
                  >
                    {msg.userId === userId ? "You" : msg.userId} •{" "}
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                  <div>{msg.message}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3>📋 How to Test</h3>
          <ol style={{ lineHeight: "1.6" }}>
            <li>Open this page in multiple browser tabs/windows</li>
            <li>Use the User Manager to switch between different users</li>
            <li>Send test messages to see real-time collaboration</li>
            <li>Check the Collaborative Editing UI for connection status</li>
            <li>Go to the Diagram page to test GoJS collaborative editing</li>
          </ol>
        </div>
      </div>

      {/* Floating UI Components */}
      <UserManager onUserChange={handleUserChange} currentUserId={userId} />

      <CollaborativeEditingUI
        isConnected={isConnected}
        connectionStatus={connectionStatus}
        activeUsers={activeUsers}
        error={error}
        onConnect={connect}
        onDisconnect={disconnect}
        projectId={projectId}
        userId={userId}
      />
    </div>
  );
};

export default CollaborativeTest;
