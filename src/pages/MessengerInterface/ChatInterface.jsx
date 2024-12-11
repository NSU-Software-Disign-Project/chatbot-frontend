import React, { useEffect, useState, useRef } from "react";
import ChatRenderer from "./Components/ChatRenderer";
import ChatLogic from "./Components/ChatLogic";
import "./ChatInterface.css";

const ChatInterface = () => {
  const [chatJson, setChatJson] = useState(null);
  const [userInput, setUserInput] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    async function fetchChatData() {
      try {
        const response = await fetch("../src/lib/data/initialChat.json");
        if (!response.ok) throw new Error("Failed to load chat JSON");
        const data = await response.json();
        setChatJson(data);
      } catch (error) {
        console.error("Error loading chat JSON:", error);
      }
    }
    fetchChatData();
  }, []);

  useEffect(() => {
    if (chatJson) {
      const renderer = new ChatRenderer(chatContainerRef.current);
      const logic = new ChatLogic(renderer);
      logic.initializeChat(chatJson);
    }
  }, [chatJson]);

  const handleSend = () => {
    if (userInput.trim()) {
      const renderer = new ChatRenderer(chatContainerRef.current);
      const logic = new ChatLogic(renderer);

      // Передаем пользовательский ввод в логику
      logic.handleUserInput(userInput);

      setUserInput(""); // Очищаем поле ввода
    }
  };

  const handleChange = (e) => {
    setUserInput(e.target.value);
  };

  return (
    <div className="App">
      <div id="chat-container" ref={chatContainerRef}></div>
      <div id="input-container">
        <input
          type="text"
          id="user-input"
          placeholder="Введите сообщение"
          value={userInput}
          onChange={handleChange}
          aria-label="User input"
        />
        <button id="send-button" onClick={handleSend} aria-label="Send message">
          Отправить
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
