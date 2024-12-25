import ChatRenderer from "./chatRenderer.js";
import ChatLogic from "./chatLogic.js";

async function loadChatJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to load chat JSON");
  return await response.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const chatContainer = document.getElementById("chat-container");
    const userInputField = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");

    const renderer = new ChatRenderer(chatContainer);
    const logic = new ChatLogic(renderer);

    const initialChatJson = await loadChatJson("../data/initialChat.json");
    logic.initializeChat(initialChatJson);

    sendButton.addEventListener("click", () => {
      const userInput = userInputField.value.trim();
      logic.handleUserInput(userInput);
      userInputField.value = "";
    });

    userInputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const userInput = userInputField.value.trim();
        logic.handleUserInput(userInput);
        userInputField.value = "";
      }
    });
  } catch (error) {
    console.error("Error initializing chat:", error);
  }
});
