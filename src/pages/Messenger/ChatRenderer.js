import React, { useState, useRef } from "react";
import "./Messenger.css";

const ChatRenderer = ({ messages, options, onOptionClick }) => {
  const chatContainerRef = useRef(null);

  // Прокрутка вниз при обновлении сообщений
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div id="chat-container" ref={chatContainerRef}>
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.sender}`}>
          {message.text}
        </div>
      ))}
      {options && (
        <div className="options">
          {options.map((option, index) => (
            <button key={index} onClick={() => onOptionClick(option)}>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatRenderer;
