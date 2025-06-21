import { useState, useEffect, useCallback } from "react";
import collaborativeEditingService from "../services/CollaborativeEditingService";

export const useCollaborativeEditing = (projectId, userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [activeUsers, setActiveUsers] = useState([]);
  const [error, setError] = useState(null);

  // Connect to collaborative editing
  const connect = useCallback(
    async (options = {}) => {
      try {
        setError(null);
        await collaborativeEditingService.connect(projectId, userId, options);
      } catch (err) {
        setError(err.message);
        console.error("Failed to connect to collaborative editing:", err);
      }
    },
    [projectId, userId]
  );

  // Disconnect from collaborative editing
  const disconnect = useCallback(() => {
    collaborativeEditingService.disconnect();
  }, []);

  // Send edit operation
  const sendEditOperation = useCallback((type, data) => {
    return collaborativeEditingService.sendEditOperation(type, data);
  }, []);

  // Utility methods for common operations
  const sendNodeMove = useCallback((nodeId, x, y) => {
    return collaborativeEditingService.sendNodeMove(nodeId, x, y);
  }, []);

  const sendNodeAdd = useCallback((nodeData) => {
    return collaborativeEditingService.sendNodeAdd(nodeData);
  }, []);

  const sendNodeDelete = useCallback((nodeId) => {
    return collaborativeEditingService.sendNodeDelete(nodeId);
  }, []);

  const sendNodeUpdate = useCallback((nodeId, updates) => {
    return collaborativeEditingService.sendNodeUpdate(nodeId, updates);
  }, []);

  const sendLinkAdd = useCallback((linkData) => {
    return collaborativeEditingService.sendLinkAdd(linkData);
  }, []);

  const sendLinkDelete = useCallback((linkId) => {
    return collaborativeEditingService.sendLinkDelete(linkId);
  }, []);

  const sendTextChange = useCallback((nodeId, text) => {
    return collaborativeEditingService.sendTextChange(nodeId, text);
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!projectId || !userId) return;

    // Connection status callback
    collaborativeEditingService.onConnectionStatus((status) => {
      setConnectionStatus(status);
      setIsConnected(status === "connected");
    });

    // User joined callback
    collaborativeEditingService.onUserJoined((data) => {
      setActiveUsers(collaborativeEditingService.getActiveUsers());
    });

    // User left callback
    collaborativeEditingService.onUserLeft((data) => {
      setActiveUsers(collaborativeEditingService.getActiveUsers());
    });

    // Cleanup on unmount
    return () => {
      collaborativeEditingService.disconnect();
    };
  }, [projectId, userId]);

  // Update active users when service state changes
  useEffect(() => {
    const updateActiveUsers = () => {
      setActiveUsers(collaborativeEditingService.getActiveUsers());
    };

    // Update immediately
    updateActiveUsers();

    // Set up interval to keep active users in sync
    const interval = setInterval(updateActiveUsers, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    // State
    isConnected,
    connectionStatus,
    activeUsers,
    error,

    // Methods
    connect,
    disconnect,
    sendEditOperation,
    sendNodeMove,
    sendNodeAdd,
    sendNodeDelete,
    sendNodeUpdate,
    sendLinkAdd,
    sendLinkDelete,
    sendTextChange,

    // Service access
    service: collaborativeEditingService,
  };
};
