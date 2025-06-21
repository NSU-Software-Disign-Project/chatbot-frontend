import io from "socket.io-client";

class CollaborativeEditingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionStatus = "disconnected";
    this.activeUsers = new Map();
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

    // Обратные вызовы
    this.onEditOperationCallback = null;
    this.onUserJoinedCallback = null;
    this.onUserLeftCallback = null;
    this.onConnectionStatusCallback = null;
    this.onProjectDataCallback = null;
  }

  // Подключение к совместному редактированию с токеном доступа (стиль Google Docs)
  async connectWithShareToken(shareToken, displayName = null) {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Генерация имени отображения, если не предоставлено
    if (!displayName) {
      displayName = `Аноним ${Math.floor(Math.random() * 1000)}`;
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(
          "Подключение к совместному редактированию с токеном доступа..."
        );

        this.socket = io(`${this.baseUrl}/collaborative`, {
          query: {
            shareToken,
            displayName,
          },
          transports: ["websocket", "polling"],
          timeout: 20000,
        });

        this.socket.on("connect", () => {
          console.log("Подключено к совместному редактированию");
          this.isConnected = true;
          this.updateConnectionStatus("connected");
          resolve();
        });

        this.socket.on("disconnect", () => {
          console.log("Отключено от совместного редактирования");
          this.isConnected = false;
          this.updateConnectionStatus("disconnected");
        });

        this.socket.on("connect_error", (error) => {
          console.error("Ошибка соединения:", error);
          this.updateConnectionStatus("error");
          reject(error);
        });

        this.socket.on("reconnect", () => {
          console.log("Переподключено к совместному редактированию");
          this.updateConnectionStatus("connected");
        });

        this.socket.on("reconnect_failed", () => {
          console.error("Не удалось переподключиться");
          this.updateConnectionStatus("reconnect_failed");
        });

        // Событие данных проекта (начальные данные при присоединении)
        this.socket.on("projectData", (data) => {
          console.log("Получены данные проекта:", data);
          if (this.onProjectDataCallback) {
            this.onProjectDataCallback(data);
          }
        });

        // События управления пользователями
        this.socket.on("userJoined", (data) => {
          console.log(
            `Пользователь присоединился: ${data.displayName || data.userId}`
          );
          this.activeUsers.set(data.socketId, {
            userId: data.userId,
            socketId: data.socketId,
            displayName: data.displayName,
            isAnonymous: data.isAnonymous,
            timestamp: data.timestamp,
          });
          if (this.onUserJoinedCallback) {
            this.onUserJoinedCallback(data);
          }
        });

        this.socket.on("userLeft", (data) => {
          console.log(
            `Пользователь покинул: ${data.displayName || data.userId}`
          );
          this.activeUsers.delete(data.socketId);
          if (this.onUserLeftCallback) {
            this.onUserLeftCallback(data);
          }
        });

        this.socket.on("userDisconnected", (data) => {
          console.log(
            `Пользователь отключился: ${data.displayName || data.userId}`
          );
          this.activeUsers.delete(data.socketId);
          if (this.onUserLeftCallback) {
            this.onUserLeftCallback(data);
          }
        });

        // События операций редактирования
        this.socket.on("editOperation", (operation) => {
          console.log(
            `Получена операция редактирования от ${
              operation.displayName || operation.userId
            }:`,
            operation
          );
          if (this.onEditOperationCallback) {
            this.onEditOperationCallback(operation);
          }
        });

        // События ошибок
        this.socket.on("error", (error) => {
          console.error("Ошибка совместного редактирования:", error);
          this.updateConnectionStatus("error");
        });
      } catch (error) {
        console.error(
          "Не удалось подключиться к совместному редактированию:",
          error
        );
        reject(error);
      }
    });
  }

  // Устаревший метод подключения (для обратной совместимости)
  async connect(projectId, userId, options = {}) {
    console.warn(
      "Используется устаревший метод подключения. Рекомендуется использовать connectWithShareToken."
    );
    return this.connectWithShareToken(projectId, `User-${userId}`);
  }

  // Отключение от совместного редактирования
  disconnect() {
    if (this.socket) {
      console.log("Отключение от совместного редактирования...");
      this.socket.emit("leaveProject");
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.activeUsers.clear();
      this.updateConnectionStatus("disconnected");
    }
  }

  // Отправка операции редактирования другим пользователям
  sendEditOperation(type, data) {
    if (!this.socket || !this.isConnected) {
      console.warn("Не подключено к совместному редактированию");
      return false;
    }

    const operation = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    console.log(`Отправка операции редактирования: ${type}`, data);
    this.socket.emit("editOperation", operation);
    return true;
  }

  // Получение активных пользователей
  getActiveUsers() {
    return Array.from(this.activeUsers.values());
  }

  // Обновление статуса соединения и уведомление обратного вызова
  updateConnectionStatus(status) {
    this.connectionStatus = status;
    if (this.onConnectionStatusCallback) {
      this.onConnectionStatusCallback(status);
    }
  }

  // Установка обратных вызовов
  onEditOperation(callback) {
    this.onEditOperationCallback = callback;
  }

  onUserJoined(callback) {
    this.onUserJoinedCallback = callback;
  }

  onUserLeft(callback) {
    this.onUserLeftCallback = callback;
  }

  onConnectionStatus(callback) {
    this.onConnectionStatusCallback = callback;
  }

  onProjectData(callback) {
    this.onProjectDataCallback = callback;
  }

  // Utility methods for common edit operations
  sendNodeMove(nodeId, x, y) {
    return this.sendEditOperation("nodeMove", { nodeId, x, y });
  }

  sendNodeAdd(nodeData) {
    return this.sendEditOperation("nodeAdd", nodeData);
  }

  sendNodeDelete(nodeId) {
    return this.sendEditOperation("nodeDelete", { nodeId });
  }

  sendNodeUpdate(nodeId, updates) {
    return this.sendEditOperation("nodeUpdate", { nodeId, ...updates });
  }

  sendLinkAdd(linkData) {
    return this.sendEditOperation("linkAdd", linkData);
  }

  sendLinkDelete(linkId) {
    return this.sendEditOperation("linkDelete", { linkId });
  }

  sendTextChange(nodeId, text) {
    return this.sendEditOperation("textChange", { nodeId, text });
  }

  sendPortChange(nodeId, portId, value) {
    return this.sendEditOperation("portChange", { nodeId, portId, value });
  }
}

// Create singleton instance
const collaborativeEditingService = new CollaborativeEditingService();
export default collaborativeEditingService;
