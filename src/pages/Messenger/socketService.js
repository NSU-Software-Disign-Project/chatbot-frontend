import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  // Установить соединение
  connect() {
    if (!this.socket) {
      this.socket = io(process.env.REACT_APP_BACKEND_ADDR || "http://localhost:8888");
      console.log("WebSocket подключен");

      // Пример обработки события от сервера
      this.socket.on("connect", () => {
        console.log("Соединение установлено с сервером");
      });

      this.socket.on("disconnect", () => {
        console.log("Соединение разорвано");
      });
    }
  }

  // Отправить сообщение "start" при открытии чата
  startBot() {
    if (this.socket) {
      this.socket.emit("start");
      console.log("Сообщение 'start' отправлено на сервер");
    }
  }

  // Отправить сообщение
  sendMessage(message) {
    if (this.socket) {
      this.socket.emit("message", message);
      console.log(`Сообщение '${message}' отправлено на сервер`);
    }
  }

  // Обработчик входящих сообщений
  onMessage(callback) {
    if (this.socket) {
      this.socket.on("message", (message) => {
        console.log("Получено сообщение от сервера:", message);
        callback(message);
      });
    }
  }

  // Закрыть соединение
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log("WebSocket отключен");
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;
