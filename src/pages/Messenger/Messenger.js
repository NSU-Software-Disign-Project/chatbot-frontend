import React, { useState, useEffect } from "react";
import "./Messenger.css";

const Messenger = ({ initialChatJson }) => {
  const [messages, setMessages] = useState([]);
  const [options, setOptions] = useState(null);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);

  const [chatData, setChatData] = useState(initialChatJson);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  const renderNextBlock = () => {
    if (currentBlockIndex >= chatData.length) return;

    const currentBlock = chatData[currentBlockIndex];
    if (!currentBlock) return;

    switch (currentBlock.type) {
      case "message":
        setMessages((prev) => [
          ...prev,
          { text: currentBlock.attributes.text, sender: "bot" },
        ]);
        setCurrentBlockIndex((prev) => prev + 1);
        break;

      case "options":
        setOptions(currentBlock.attributes.variants);
        break;

      case "input":
        setMessages((prev) => [
          ...prev,
          { text: currentBlock.attributes.prompt, sender: "bot" },
        ]);
        setIsWaitingForInput(true); // Ждём ввода
        break;

      default:
        console.warn(`Unknown block type: ${currentBlock.type}`);
        setCurrentBlockIndex((prev) => prev + 1);
    }
  };

  const handleOptionClick = (option) => {
    setMessages((prev) => [...prev, { text: option, sender: "user" }]);
    setOptions(null);

    const currentBlock = chatData[currentBlockIndex];
    if (currentBlock.conditions && currentBlock.conditions[option]) {
      const newBlocks = currentBlock.conditions[option];
      setChatData((prev) => [
        ...prev.slice(0, currentBlockIndex + 1),
        ...newBlocks,
        ...prev.slice(currentBlockIndex + 1),
      ]);
    }

    setCurrentBlockIndex((prev) => prev + 1);
    renderNextBlock();
  };

  const handleUserInput = (userInput) => {
    if (isWaitingForInput && userInput.trim()) {
      setMessages((prev) => [...prev, { text: userInput, sender: "user" }]);
      setIsWaitingForInput(false);
      setCurrentBlockIndex((prev) => prev + 1);
      renderNextBlock();
    }
  };

  useEffect(() => {
    renderNextBlock();
  }, [currentBlockIndex]);

  return (
    <div className="body">
      <div id="chat-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {options && (
          <div className="options">
            {options.map((option, idx) => (
              <button key={idx} onClick={() => handleOptionClick(option)}>
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
      <div id="input-container">
        <input
          type="text"
          id="user-input"
          placeholder="Введите сообщение"
          onKeyPress={(e) => {
            if (e.key === "Enter") handleUserInput(e.target.value);
          }}
        />
        <button
          id="send-button"
          onClick={(e) => handleUserInput(e.target.previousSibling.value)}
        >
          Отправить
        </button>
      </div>
    </div>
  );
};

export default Messenger;
