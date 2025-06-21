import React, { useState } from "react";

const UserManager = ({ onUserChange, currentUserId }) => {
  const [selectedUser, setSelectedUser] = useState(currentUserId || "user-1");

  const users = [
    { id: "user-1", name: "Alice", color: "#4CAF50" },
    { id: "user-2", name: "Bob", color: "#2196F3" },
    { id: "user-3", name: "Charlie", color: "#FF9800" },
    { id: "user-4", name: "Diana", color: "#9C27B0" },
    { id: "user-5", name: "Eve", color: "#F44336" },
  ];

  const handleUserChange = (userId) => {
    setSelectedUser(userId);
    onUserChange(userId);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "10px",
        background: "rgba(30, 30, 30, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        padding: "12px",
        minWidth: "200px",
        zIndex: 1000,
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          color: "#fff",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        👤 Switch User
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserChange(user.id)}
            style={{
              background:
                selectedUser === user.id
                  ? user.color
                  : "rgba(255, 255, 255, 0.1)",
              color: selectedUser === user.id ? "white" : "#ccc",
              border: "none",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: user.color,
                flexShrink: 0,
              }}
            ></span>
            {user.name}
            {selectedUser === user.id && (
              <span style={{ marginLeft: "auto", fontSize: "10px" }}>✓</span>
            )}
          </button>
        ))}
      </div>

      <div
        style={{
          fontSize: "10px",
          color: "#888",
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        Current:{" "}
        {users.find((u) => u.id === selectedUser)?.name || selectedUser}
      </div>
    </div>
  );
};

export default UserManager;
