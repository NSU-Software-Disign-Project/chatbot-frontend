import webSocket from "./webSocket.js";

// Логика отображения сообщений
const chatPreview = {
    init() {
        const messageForm = document.getElementById("messageForm");
        const messageInput = document.getElementById("messageInput");

        messageForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const message = messageInput.value;
            if (message.trim() !== "") {
                webSocket.sendMessage(message); // Отправляем сообщение через WebSocket
                chatPreview.displayMessage("Вы", message); // Показываем сообщение в интерфейсе
                messageInput.value = ""; // Очищаем поле ввода
            }
        });
    },

    displayMessage(sender, message) {
        const messagesContainer = document.getElementById("messagesContainer");
        const messageElement = document.createElement("div");
        messageElement.textContent = `${sender}: ${message}`;
        messagesContainer.appendChild(messageElement);
    }
};

export default chatPreview;
