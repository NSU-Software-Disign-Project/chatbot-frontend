import { io } from "socket.io-client";

const socket = io("http://localhost:8080");

// Получение сообщений от сервера
socket.on("message", (data) => {
  console.log("Получено сообщение от сервера:", data);
});

// Получение запроса ввода
socket.on("requestInput", (prompt) => {
  const userInput = promptUser(prompt); // Ваш способ получения ввода, например prompt()
  socket.emit("inputResponse", userInput);
});

// Запуск чата
socket.emit("start");

// Обработка ошибок
socket.on("error", (err) => {
  console.error("Ошибка:", err);
});
