import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as go from "gojs";
import saveBlock from "./Diagram/Blocks/saveBlock";
import messageBlock from "./Diagram/Blocks/messageBlock";
import apiBlock from "./Diagram/Blocks/apiBlock";
import startBlock from "./Diagram/Blocks/startBlock";
import { createConditionalBlock } from "./Diagram/Blocks/conditionalBlock";
import { createOptionsBlock } from "./Diagram/Blocks/optionsBlock";
import createPort from "./Diagram/Blocks/createPort";
import { createDiagram } from "./Diagram/Blocks/diagram";
import collaborativeEditingService from "../services/CollaborativeEditingService";
import GoJSCollaborativeIntegration from "../services/GoJSCollaborativeIntegration";

const CollaborativePage = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const diagramRef = useRef(null);
  const paletteRef = useRef(null);
  const diagramRefObject = useRef(null);

  // State
  const [projectName, setProjectName] = useState("Loading...");
  const [displayName, setDisplayName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [activeUsers, setActiveUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // GoJS collaborative integration
  const gojsIntegrationRef = useRef(null);

  // Initialize collaborative editing
  useEffect(() => {
    const initializeCollaborativeEditing = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get username from authentication first
        let username = displayName;
        if (!username) {
          const token = localStorage.getItem("token");
          if (token) {
            try {
              const userResponse = await fetch(
                "http://localhost:8080/auth/me",
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (userResponse.ok) {
                const userData = await userResponse.json();
                username =
                  userData.user.username ||
                  userData.user.name ||
                  userData.user.email;
              }
            } catch (err) {
              console.log("Could not get user info from token");
            }
          }

          // If still no username, generate a random one
          if (!username) {
            username = `Anonymous ${Math.floor(Math.random() * 1000)}`;
          }

          setDisplayName(username);
        }

        // Connect to collaborative editing
        await collaborativeEditingService.connectWithShareToken(
          shareToken,
          username
        );
        setIsConnected(true);

        // Set up event listeners
        collaborativeEditingService.onConnectionStatus((status) => {
          setConnectionStatus(status);
          setIsConnected(status === "connected");
        });

        collaborativeEditingService.onUserJoined((data) => {
          setActiveUsers(collaborativeEditingService.getActiveUsers());
        });

        collaborativeEditingService.onUserLeft((data) => {
          setActiveUsers(collaborativeEditingService.getActiveUsers());
        });

        collaborativeEditingService.onEditOperation((operation) => {
          setLastSyncTime(new Date().toISOString());
        });

        collaborativeEditingService.onProjectData((data) => {
          setProjectName(data.projectName || "Untitled Project");

          // Load diagram data when diagram is ready
          setTimeout(() => {
            if (diagramRefObject.current) {
              // If we have project data, use it
              if (
                data.nodeDataArray &&
                data.linkDataArray &&
                data.nodeDataArray.length > 0
              ) {
                diagramRefObject.current.model = new go.GraphLinksModel({
                  linkFromPortIdProperty: "fromPort",
                  linkToPortIdProperty: "toPort",
                  nodeDataArray: data.nodeDataArray,
                  linkDataArray: data.linkDataArray,
                });
              } else {
                // If no project data or empty, ensure we have a start block
                const currentModel = diagramRefObject.current.model;
                if (!currentModel || currentModel.nodeDataArray.length === 0) {
                  diagramRefObject.current.model = new go.GraphLinksModel({
                    linkFromPortIdProperty: "fromPort",
                    linkToPortIdProperty: "toPort",
                    nodeDataArray: [
                      {
                        key: 1,
                        category: "startBlock",
                        loc: new go.Point(100, 100),
                      },
                    ],
                    linkDataArray: [],
                  });
                }
              }
            }
          }, 500);
        });

        setLoading(false);
      } catch (error) {
        console.error("Error initializing collaborative editing:", error);
        setError(error.message || "Failed to connect to collaborative editing");
        setLoading(false);
      }
    };

    if (shareToken) {
      initializeCollaborativeEditing();
    }

    // Cleanup on unmount
    return () => {
      collaborativeEditingService.disconnect();
    };
  }, [shareToken]);

  // Initialize GoJS diagram
  useEffect(() => {
    const timer = setTimeout(() => {
      const $ = go.GraphObject.make;
      let diagram;
      let palette;

      // Check if diagram already exists and clean it up
      if (diagramRefObject.current) {
        diagramRefObject.current.div = null;
        diagramRefObject.current = null;
      }

      // Only create diagram if ref is available and no diagram exists
      if (diagramRef.current && !go.Diagram.fromDiv(diagramRef.current)) {
        // Clear any existing content
        diagramRef.current.innerHTML = "";

        diagram = createDiagram(diagramRef.current);

        // Check if diagram was created successfully
        if (!diagram) {
          console.error("Failed to create diagram");
          return;
        }
      } else if (diagramRef.current && go.Diagram.fromDiv(diagramRef.current)) {
        // Use existing diagram
        diagram = go.Diagram.fromDiv(diagramRef.current);
      } else {
        console.error("Diagram ref not available");
        return;
      }

      diagram.nodeTemplateMap.add("saveBlock", saveBlock);
      diagram.nodeTemplateMap.add("apiBlock", apiBlock);
      diagram.nodeTemplateMap.add("messageBlock", messageBlock);
      diagram.nodeTemplateMap.add(
        "conditionalBlock",
        createConditionalBlock(diagram)
      );
      diagram.nodeTemplateMap.add("optionsBlock", createOptionsBlock(diagram));
      diagram.nodeTemplateMap.add("startBlock", startBlock);

      // Set initial model with a start block if no data exists
      if (!diagram.model || diagram.model.nodeDataArray.length === 0) {
        diagram.model = new go.GraphLinksModel({
          linkFromPortIdProperty: "fromPort",
          linkToPortIdProperty: "toPort",
          nodeDataArray: [
            {
              key: 1,
              category: "startBlock",
              startText: "Start",
              loc: new go.Point(100, 100),
            },
          ],
          linkDataArray: [],
        });
      }

      // Store diagram reference
      diagramRefObject.current = diagram;

      // Set up collaborative editing integration
      if (isConnected) {
        gojsIntegrationRef.current = new GoJSCollaborativeIntegration(diagram);
        gojsIntegrationRef.current.setupGoJSEventListeners();
      }

      // Create palette
      if (paletteRef.current) {
        // Clear any existing content and destroy any existing palette
        if (paletteRef.current.children.length > 0) {
          const existingPalette = go.Diagram.fromDiv(paletteRef.current);
          if (existingPalette) {
            existingPalette.div = null;
          }
        }
        paletteRef.current.innerHTML = "";

        // Only create palette if no palette exists
        if (!go.Diagram.fromDiv(paletteRef.current)) {
          palette = $(go.Palette, paletteRef.current, {
            layout: $(go.GridLayout, {
              wrappingColumn: 1,
              spacing: new go.Size(0, 20),
            }),
            nodeTemplateMap: diagram.nodeTemplateMap,
            contentAlignment: go.Spot.Center,
            padding: new go.Margin(0, 0, 20, 0),
            allowZoom: false,
          });

          // Add nodes to palette
          const nodeDataArray = [
            { category: "startBlock", startText: "Start" },
            { category: "messageBlock", message: "Text message" },
            { category: "apiBlock", variableName: "variable", url: "link" },
            {
              category: "conditionalBlock",
              variableName: "variable name",
              conditions: [{ "": "", portId: "OUT" }],
            },
            { category: "optionsBlock" },
            { category: "saveBlock", variableName: "variable name" },
          ];

          palette.model = new go.GraphLinksModel({
            nodeDataArray: nodeDataArray,
          });
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Clean up collaborative editing integration
      if (gojsIntegrationRef.current) {
        gojsIntegrationRef.current.cleanup();
        gojsIntegrationRef.current = null;
      }

      // Clean up diagram
      if (diagramRefObject.current) {
        diagramRefObject.current.div = null;
        diagramRefObject.current = null;
      }

      // Clean up palette
      if (paletteRef.current && paletteRef.current.children.length > 0) {
        const existingPalette = go.Diagram.fromDiv(paletteRef.current);
        if (existingPalette) {
          existingPalette.div = null;
        }
        paletteRef.current.innerHTML = "";
      }
    };
  }, [isConnected]);

  // Set up collaborative integration when connected
  useEffect(() => {
    if (
      isConnected &&
      diagramRefObject.current &&
      !gojsIntegrationRef.current
    ) {
      gojsIntegrationRef.current = new GoJSCollaborativeIntegration(
        diagramRefObject.current
      );
      gojsIntegrationRef.current.setupGoJSEventListeners();
    }
  }, [isConnected, diagramRefObject.current]);

  const handleDisplayNameChange = (e) => {
    const newName = e.target.value;
    setDisplayName(newName);
  };

  // Debounced display name update to avoid too many reconnections
  // useEffect(() => {
  //   if (displayName && isConnected) {
  //     const timer = setTimeout(() => {
  //       // Reconnect with new display name
  //       collaborativeEditingService.disconnect();
  //       collaborativeEditingService.connectWithShareToken(
  //         shareToken,
  //         displayName
  //       );
  //     }, 1000); // 1 second delay

  //     return () => clearTimeout(timer);
  //   }
  // }, [displayName, shareToken, isConnected]);

  const handleBackToHome = () => {
    navigate("/");
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#4CAF50";
      case "connecting":
        return "#FF9800";
      case "error":
        return "#F44336";
      default:
        return "#666";
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#1e1e1e",
          color: "#fff",
        }}
      >
        <div>Connecting to collaborative editing...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#1e1e1e",
          color: "#fff",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: "20px" }}>Ошибка: {error}</div>
        <button
          onClick={handleBackToHome}
          style={{
            backgroundColor: "#7d3cff",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          На главную
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          backgroundColor: "#1e1e1e",
          display: "flex",
          flexDirection: "row",
          height: "7vh",
          alignItems: "center",
          padding: "0 10px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            style={{
              backgroundColor: "#7d3cff",
              color: "#fff",
              border: "none",
              padding: "10px",
              borderRadius: "5px",
              cursor: "pointer",
              marginRight: "20px",
            }}
            onClick={handleBackToHome}
          >
            ← Back
          </button>

          <div
            style={{
              color: "#fff",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {projectName}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Display Name Input */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ color: "#fff", fontSize: "14px" }}>
              Your name:
            </label>
            <input
              type="text"
              value={displayName}
              onChange={handleDisplayNameChange}
              style={{
                padding: "5px 10px",
                borderRadius: "3px",
                border: "1px solid #333",
                backgroundColor: "#2a2a2a",
                color: "#fff",
                fontSize: "14px",
              }}
              placeholder="Enter your name"
            />
          </div>

          {/* Connection Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: getConnectionStatusColor(),
              }}
            />
            <span style={{ color: "#fff", fontSize: "14px" }}>
              {connectionStatus}
            </span>
          </div>

          {/* Active Users */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#fff", fontSize: "14px" }}>
              Пользователи:{" "}
              {(() => {
                const otherUsers = activeUsers.filter(
                  (user) =>
                    user.displayName !== displayName &&
                    user.userId !==
                      `anon-${collaborativeEditingService.socket?.id}`
                );
                return otherUsers.length > 0 ? (
                  <span
                    title={otherUsers
                      .map((user) => user.displayName || user.userId)
                      .join(", ")}
                  >
                    {otherUsers.length} других пользователей онлайн
                    {otherUsers.length <= 3 && (
                      <span style={{ marginLeft: "5px", opacity: 0.8 }}>
                        (
                        {otherUsers
                          .map((user) => user.displayName || user.userId)
                          .join(", ")}
                        )
                      </span>
                    )}
                  </span>
                ) : (
                  "Нет других пользователей онлайн"
                );
              })()}
            </span>
          </div>

          {/* Sync Status */}
          {lastSyncTime && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ color: "#4CAF50", fontSize: "12px" }}>
                Синхронизировано {new Date(lastSyncTime).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", height: "93vh", gap: "0px" }}>
        <div
          ref={paletteRef}
          style={{
            width: "240px",
            background: "#111",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            height: "100%",
          }}
        ></div>

        <div
          ref={diagramRef}
          style={{
            flex: 1,
            background: "#1e1e1e",
            borderRadius: "12px",
            margin: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        ></div>
      </div>
    </>
  );
};

export default CollaborativePage;
