import React from "react";

const CustomNode = ({ text, color }) => {
  return (
    <div
      style={{
        border: `2px solid ${color}`,
        borderRadius: "8px",
        padding: "10px",
        backgroundColor: color,
        textAlign: "center",
        width: "100px",
      }}
    >
      <strong>{text}</strong>
    </div>
  );
};

export default CustomNode;
