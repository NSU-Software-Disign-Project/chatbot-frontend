import React, { useState, useEffect } from "react";
import Messenger from "./Messenger";

const MessengerApp = () => {
  const [initialChatJson, setInitialChatJson] = useState(null);

  useEffect(() => {
    const loadChatJson = async () => {
      try {
        const response = await fetch("/initialChat.json");
        if (!response.ok) throw new Error("Failed to load chat JSON");
        const jsonData = await response.json();
        setInitialChatJson(jsonData);
      } catch (error) {
        console.error("Error loading chat JSON:", error);
      }
    };
    loadChatJson();
  }, []);

  return initialChatJson ? <Messenger initialChatJson={initialChatJson} /> : <p>Loading...</p>;
};

export default MessengerApp;
