import React from "react";

const CollaborativeEditingUI = ({
  isConnected,
  connectionStatus,
  activeUsers,
  error,
  onConnect,
  onDisconnect,
  projectId,
  userId,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "#4CAF50";
      case "connecting":
        return "#FF9800";
      case "reconnecting":
        return "#FF9800";
      case "error":
        return "#F44336";
      case "reconnect_failed":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "reconnecting":
        return "Reconnecting...";
      case "error":
        return "Connection Error";
      case "reconnect_failed":
        return "Reconnection Failed";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
        return "🟢";
      case "connecting":
        return "🟡";
      case "reconnecting":
        return "🟡";
      case "error":
        return "🔴";
      case "reconnect_failed":
        return "🔴";
      default:
        return "⚪";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "rgba(30, 30, 30, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        padding: "12px",
        minWidth: "280px",
        zIndex: 1000,
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          paddingBottom: "8px",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#fff",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          🤝 Collaborative Editing
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "12px" }}>
            {getStatusIcon(connectionStatus)}
          </span>
          <span
            style={{
              fontSize: "12px",
              color: getStatusColor(connectionStatus),
              fontWeight: "bold",
            }}
          >
            {getStatusText(connectionStatus)}
          </span>
        </div>
      </div>

      {/* Project Info */}
      <div
        style={{
          marginBottom: "12px",
          fontSize: "12px",
          color: "#ccc",
        }}
      >
        <div>🏠 Project: {projectId || "Not set"}</div>
        <div>👤 User: {userId || "Not set"}</div>
      </div>

      {/* Connection Controls */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {!isConnected ? (
          <button
            onClick={onConnect}
            style={{
              background: "#4CAF50",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Connect
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            style={{
              background: "#F44336",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.3)",
            borderRadius: "4px",
            padding: "8px",
            marginBottom: "12px",
            fontSize: "12px",
            color: "#ff6b6b",
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Active Users */}
      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "#ccc",
            marginBottom: "6px",
            fontWeight: "bold",
          }}
        >
          👥 Active Users ({activeUsers.length})
        </div>
        <div
          style={{
            maxHeight: "120px",
            overflowY: "auto",
          }}
        >
          {activeUsers.length === 0 ? (
            <div
              style={{
                fontSize: "11px",
                color: "#888",
                fontStyle: "italic",
              }}
            >
              No other users connected
            </div>
          ) : (
            activeUsers.map((user, index) => (
              <div
                key={user.socketId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 0",
                  fontSize: "11px",
                  color: user.userId === userId ? "#4CAF50" : "#fff",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: user.userId === userId ? "#4CAF50" : "#2196F3",
                    flexShrink: 0,
                  }}
                ></span>
                <span
                  style={{
                    fontWeight: user.userId === userId ? "bold" : "normal",
                  }}
                >
                  {user.userId === userId ? "You" : user.userId}
                </span>
                {user.userId === userId && (
                  <span style={{ fontSize: "10px", color: "#888" }}>
                    (current)
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Connection Info */}
      <div
        style={{
          fontSize: "10px",
          color: "#888",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: "8px",
        }}
      >
        <div>📡 WebSocket: {isConnected ? "Active" : "Inactive"}</div>
        <div>🔄 Auto-reconnect: Enabled</div>
      </div>
    </div>
  );
};

export default CollaborativeEditingUI;
