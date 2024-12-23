import { io } from "socket.io-client";

const backendAddr = process.env.REACT_APP_ENV === 'production' 
    ? process.env.REACT_APP_BACKEND_CONTAINER 
    : process.env.REACT_APP_BACKEND_ADDR;

console.log("Backend address for WebSocket:", backendAddr); // Debugging statement

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
    }

  // Установить соединение
  connect(url = backendAddr) {
    if (this.socket) {
        console.warn("WebSocket уже подключен");
        return;
      }
  
    this.socket = io(url, {
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 5000,
    });
    console.log("WebSocket создан");

    // Пример обработки события от сервера
    this.socket.on("connect", () => {
        console.log("Соединение установлено с сервером");
    });

    this.socket.on("disconnect", () => {
        console.log("Соединение разорвано");
    });

    this.socket.on("connect_error", (error) => {
        console.error("Ошибка подключения:", error);
    });
  }

  // Отправить сообщение "start" при открытии чата
  startBot(projectName) {
    if (this.socket) {
      this.socket.emit("start", projectName);
      console.log(`Сообщение 'start' с projectName '${projectName}' отправлено на сервер`);
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

  // Обработчик запроса ввода
  onRequestInput(callback) {
    if (this.socket) {
      this.socket.on("requestInput", (prompt) => {
        console.log("Запрос ввода от сервера:", prompt);
        callback(prompt);
      });
    }
  }

  // Отправить ответ на запрос ввода
  sendInputResponse(input) {
    if (this.socket) {
      this.socket.emit("inputResponse", input);
      console.log("Ответ на запрос ввода отправлен:", input);
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
