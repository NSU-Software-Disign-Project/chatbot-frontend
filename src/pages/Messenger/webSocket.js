// Подключение Socket.IO
const socket = io("http://localhost:8080"); // Укажите ваш порт, если он отличается

// WebSocket логика
const webSocket = {
    init(chatPreview) {
        socket.on("connect", () => {
            console.log("Соединение установлено с сервером, ID:", socket.id);
            socket.emit("start");
        });

        socket.on("message", (message) => {
            console.log("Новое сообщение от сервера:", message);
            chatPreview.displayMessage("Сервер", message);
        });

        socket.on("error", (err) => {
            console.error("Ошибка на клиенте:", err);
        });

        socket.on("disconnect", () => {
            console.log("Соединение с сервером разорвано.");
        });
    },

    sendMessage(message) {
        socket.emit("input", message);
    }
};

export default webSocket;