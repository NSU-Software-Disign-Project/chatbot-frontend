import io from "socket.io-client";

class CollaborativeEditingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionStatus = "disconnected";
    this.activeUsers = [];
    this.projectId = null;
    this.userId = null;
    this.shareToken = null;
    this.displayName = null;

    // Callbacks
    this.onEditOperationCallback = null;
    this.onUserJoinedCallback = null;
    this.onUserLeftCallback = null;
    this.onConnectionStatusCallback = null;
    this.onProjectDataCallback = null;

    // Reconnection settings
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.reconnectTimer = null;
  }

  // Connect to collaborative editing with project ID and user ID
  async connect(projectId, userId, options = {}) {
    if (this.socket && this.isConnected) {
      console.log("Already connected to collaborative editing");
      return;
    }

    this.projectId = projectId;
    this.userId = userId;
    this.updateConnectionStatus("connecting");

    try {
      const { io } = await import("socket.io-client");

      this.socket = io(
        `${options.serverUrl || "http://localhost:8080"}/project`,
        {
          query: {
            projectId: this.projectId,
            userId: this.userId,
          },
          transports: ["websocket", "polling"],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        }
      );

      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 10000);

        this.socket.once("connect", () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.updateConnectionStatus("connected");
          this.reconnectAttempts = 0;
          console.log(
            `Connected to collaborative editing for project ${this.projectId}`
          );
          resolve();
        });

        this.socket.once("connect_error", (error) => {
          clearTimeout(timeout);
          this.updateConnectionStatus("error");
          console.error("Connection error:", error);
          reject(error);
        });
      });
    } catch (error) {
      this.updateConnectionStatus("error");
      console.error("Failed to connect to collaborative editing:", error);
      throw error;
    }
  }

  // Connect with share token (for anonymous users)
  async connectWithShareToken(shareToken, displayName = null) {
    if (this.socket && this.isConnected) {
      console.log("Already connected to collaborative editing");
      return;
    }

    this.shareToken = shareToken;
    this.displayName =
      displayName || `Anonymous ${Math.floor(Math.random() * 1000)}`;
    this.updateConnectionStatus("connecting");

    return new Promise((resolve, reject) => {
      try {
        import("socket.io-client").then(({ io }) => {
          this.socket = io("http://localhost:8080/collaborative", {
            query: {
              shareToken: this.shareToken,
              displayName: this.displayName,
            },
            transports: ["websocket", "polling"],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
          });

          this.setupEventListeners();

          const timeout = setTimeout(() => {
            reject(new Error("Connection timeout"));
          }, 10000);

          this.socket.once("connect", () => {
            clearTimeout(timeout);
            this.isConnected = true;
            this.updateConnectionStatus("connected");
            this.reconnectAttempts = 0;
            console.log(
              `Connected to collaborative editing with share token ${this.shareToken}`
            );
            resolve();
          });

          this.socket.once("connect_error", (error) => {
            clearTimeout(timeout);
            this.updateConnectionStatus("error");
            console.error("Connection error:", error);
            reject(error);
          });
        });
      } catch (error) {
        this.updateConnectionStatus("error");
        console.error("Failed to connect to collaborative editing:", error);
        reject(error);
      }
    });
  }

  // Set up event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("Connected to collaborative editing server");
      this.isConnected = true;
      this.updateConnectionStatus("connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from collaborative editing server:", reason);
      this.isConnected = false;
      this.updateConnectionStatus("disconnected");

      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.updateConnectionStatus("connected");
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.updateConnectionStatus("reconnecting");
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Failed to reconnect after maximum attempts");
      this.updateConnectionStatus("reconnect_failed");
    });

    // User events
    this.socket.on("userJoined", (data) => {
      console.log(`User joined: ${data.userId || data.displayName}`);
      this.updateActiveUsers();
      if (this.onUserJoinedCallback) {
        this.onUserJoinedCallback(data);
      }
    });

    this.socket.on("userLeft", (data) => {
      console.log(`User left: ${data.userId || data.displayName}`);
      this.updateActiveUsers();
      if (this.onUserLeftCallback) {
        this.onUserLeftCallback(data);
      }
    });

    this.socket.on("userDisconnected", (data) => {
      console.log(`User disconnected: ${data.userId || data.displayName}`);
      this.updateActiveUsers();
      if (this.onUserLeftCallback) {
        this.onUserLeftCallback(data);
      }
    });

    // Edit operation events
    this.socket.on("editOperation", (operation) => {
      console.log(
        `Received edit operation from ${
          operation.displayName || operation.userId
        }:`,
        operation
      );
      if (this.onEditOperationCallback) {
        this.onEditOperationCallback(operation);
      }
    });

    // Project data events
    this.socket.on("projectData", (data) => {
      console.log("Received project data:", data);
      if (this.onProjectDataCallback) {
        this.onProjectDataCallback(data);
      }
    });

    // Error events
    this.socket.on("error", (error) => {
      console.error("Collaborative editing error:", error);
      this.updateConnectionStatus("error");
    });
  }

  // Update connection status and notify callback
  updateConnectionStatus(status) {
    this.connectionStatus = status;
    if (this.onConnectionStatusCallback) {
      this.onConnectionStatusCallback(status);
    }
  }

  // Update active users list
  updateActiveUsers() {
    // This would typically be updated from server events
    // For now, we'll keep it simple
    this.activeUsers = this.activeUsers.filter(
      (user) => user.socketId !== this.socket?.id
    );
  }

  // Disconnect from collaborative editing
  disconnect() {
    if (this.socket) {
      console.log("Disconnecting from collaborative editing");
      this.socket.emit("leaveProject");
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.updateConnectionStatus("disconnected");
    this.activeUsers = [];

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Send edit operation to other users
  sendEditOperation(type, data) {
    if (!this.socket || !this.isConnected) {
      console.warn("Not connected to collaborative editing");
      return false;
    }

    const operation = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    console.log(`📤 IMMEDIATE: Sending edit operation: ${type}`, data);

    // Send immediately without any queuing or delays
    this.socket.emit("editOperation", operation);

    console.log(`✅ IMMEDIATE: Edit operation sent successfully: ${type}`);
    return true;
  }

  // Set up callbacks
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

  // Get current state
  getConnectionStatus() {
    return this.connectionStatus;
  }

  getActiveUsers() {
    return this.activeUsers;
  }

  isConnectedToServer() {
    return this.isConnected;
  }
}

// Create singleton instance
const collaborativeEditingService = new CollaborativeEditingService();
export default collaborativeEditingService;
