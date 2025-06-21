import React, { useEffect, useRef, useState } from "react";
import * as go from "gojs";
import { useLocation, useNavigate } from "react-router-dom";
import saveBlock from "./Blocks/saveBlock";
import messageBlock from "./Blocks/messageBlock";
import apiBlock from "./Blocks/apiBlock";
import startBlock from "./Blocks/startBlock";
import { createConditionalBlock } from "./Blocks/conditionalBlock";
import { createOptionsBlock } from "./Blocks/optionsBlock";
import createPort from "./Blocks/createPort";
import { createDiagram } from "./Blocks/diagram";
import {
  saveDiagramServer,
  loadDiagramServer,
  saveDiagramLocally,
  loadDiagramLocally,
} from "./SaveLoad";
import ChatPreview from "../Messenger/ChatPreview";
import { useCollaborativeEditing } from "../../hooks/useCollaborativeEditing";
import CollaborativeEditingUI from "../../components/CollaborativeEditingUI";
import GoJSCollaborativeIntegration from "../../services/GoJSCollaborativeIntegration";
import UserManager from "../../components/UserManager";
import projectSharingService from "../../services/ProjectSharingService";

const Diagram = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const diagramRef = useRef(null);
  const paletteRef = useRef(null);
  const diagramRefObject = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showCollaborativeUI, setShowCollaborativeUI] = useState(true);
  const [showUserManager, setShowUserManager] = useState(true);

  // Project state
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("unprocessed");
  const [isShared, setIsShared] = useState(false);
  const [permission, setPermission] = useState("admin");
  const [loading, setLoading] = useState(true);

  // Collaborative editing setup
  const [userId, setUserId] = useState(`user-${Date.now()}`); // This should come from user authentication

  const {
    isConnected,
    connectionStatus,
    activeUsers,
    error,
    connect,
    disconnect,
  } = useCollaborativeEditing(projectId, userId);

  // GoJS collaborative integration
  const gojsIntegrationRef = useRef(null);

  // Initialize project from navigation state or URL
  useEffect(() => {
    const initializeProject = async () => {
      try {
        setLoading(true);

        // Get user info
        const token = localStorage.getItem("token");
        if (token) {
          projectSharingService.updateToken(token);

          try {
            const userResponse = await fetch("http://localhost:8080/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUserId(userData.user.id);
            }
          } catch (err) {
            console.log("User not logged in or token expired");
          }
        }

        // Check if we have project info from navigation state
        if (location.state) {
          const {
            projectId: navProjectId,
            projectName: navProjectName,
            isShared: navIsShared,
            permission: navPermission,
          } = location.state;

          if (navProjectId) {
            setProjectId(navProjectId);
            setProjectName(navProjectName || "Untitled Project");
            setIsShared(navIsShared || false);
            setPermission(navPermission || "admin");

            // Load project data
            await loadProjectData(navProjectId);
          }
        } else {
          // No project specified, create new project or show project selection
          console.log("No project specified, using default");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error initializing project:", error);
        setLoading(false);
      }
    };

    initializeProject();
  }, [location.state]);

  const loadProjectData = async (projectId) => {
    try {
      const projectResponse =
        await projectSharingService.getProjectByShareableId(projectId);
      const projectData = projectResponse.data;

      // Load diagram data if available
      if (projectData.nodeDataArray && projectData.linkDataArray) {
        // Load the diagram data when diagram is ready
        setTimeout(() => {
          if (diagramRefObject.current) {
            diagramRefObject.current.model = new go.GraphLinksModel({
              linkFromPortIdProperty: "fromPort",
              linkToPortIdProperty: "toPort",
              nodeDataArray: projectData.nodeDataArray,
              linkDataArray: projectData.linkDataArray,
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error loading project data:", error);
    }
  };

  // Handle user change
  const handleUserChange = (newUserId) => {
    // Disconnect current user
    disconnect();

    // Update user ID
    setUserId(newUserId);

    // Reconnect with new user
    setTimeout(() => {
      connect();
    }, 1000);
  };

  const handleBackToProjects = () => {
    navigate("/me");
  };

  const canEdit = permission === "edit" || permission === "admin";

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const $ = go.GraphObject.make;
      let diagram;
      let palette;

      // Check if diagram already exists and clean it up
      if (diagramRefObject.current) {
        diagramRefObject.current.div = null;
        diagramRefObject.current = null;
      }

      // Only create diagram if ref is available
      if (diagramRef.current) {
        // Clear any existing content
        diagramRef.current.innerHTML = "";

        diagram = createDiagram(diagramRef.current);

        // Check if diagram was created successfully
        if (!diagram) {
          console.error("Failed to create diagram");
          return;
        }
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
      diagram.nodeTemplate = $(
        go.Node,
        "Auto",
        // Default template for any unrecognized node types
        $(go.Shape, "RoundedRectangle", {
          fill: "lightgray",
          stroke: "gray",
          strokeWidth: 2,
        }),
        $(
          go.TextBlock,
          {
            margin: new go.Margin(8, 16),
            stroke: "black",
          },
          new go.Binding("text", "text")
        )
      );

      diagram.div.style.pointerEvents = "auto";

      diagram.linkTemplate = $(
        go.Link,
        {
          corner: 5,
          curve: go.Link.JumpOver,
          toShortLength: 4,
        },
        new go.Binding("points").makeTwoWay(),
        $(go.Shape, { isPanelMain: true, stroke: "white", strokeWidth: 1 }),
        $(go.Shape, {
          toArrow: "roundedTriangle",
          stroke: "white",
          fill: "white",
          scale: 0.8,
        })
      );

      diagram.layout = new go.LayeredDigraphLayout({ columnSpacing: 10 });
      diagram.model = new go.GraphLinksModel({
        linkFromPortIdProperty: "fromPort",
        linkToPortIdProperty: "toPort",
        nodeDataArray: [
          {
            key: 0,
            category: "startBlock",
            startText: "Start",
          },
          {
            key: 1,
            category: "messageBlock",
            message: "Text message",
          },
          {
            key: 2,
            category: "conditionalBlock",
            variableName: "variable name",
            conditions: [{ "": "", portId: "OUT" }],
          },
          {
            key: 3,
            category: "optionsBlock",
          },
          {
            key: 4,
            category: "saveBlock",
            variableName: "variable name",
          },
          {
            key: 5,
            category: "apiBlock",
            variableName: "variable name",
            url: "https://api.blockchain.org",
          },
        ],
        linkDataArray: [],
      });

      // Only create palette if ref is available
      if (paletteRef.current) {
        // Clear any existing content
        paletteRef.current.innerHTML = "";

        // Check if palette already exists and clean it up
        try {
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

          palette.model = new go.GraphLinksModel([
            {
              key: 0,
              category: "startBlock",
              startText: "Start",
            },
            {
              key: 1,
              category: "messageBlock",
              message: "Text message",
            },
            {
              key: 2,
              category: "conditionalBlock",
              variableName: "variable name",
              conditions: [{ "": "", portId: "OUT" }],
            },
            {
              key: 3,
              category: "optionsBlock",
            },
            {
              key: 4,
              category: "saveBlock",
              variableName: "variable name",
            },
            {
              key: 5,
              category: "apiBlock",
              variableName: "variable",
              url: "link",
            },
          ]);
        } catch (error) {
          console.error("Failed to create palette:", error);
          // If palette creation fails, clear the ref and try again
          paletteRef.current.innerHTML = "";
          palette = null;
        }
      }

      diagramRefObject.current = diagram;

      // Set up collaborative editing integration
      gojsIntegrationRef.current = new GoJSCollaborativeIntegration(diagram);
      gojsIntegrationRef.current.setupGoJSEventListeners();
    }, 100); // 100ms delay to ensure DOM is ready

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
    };
  }, []);

  // Автоматическое подключение к совместному редактированию при монтировании компонента и наличии projectId
  useEffect(() => {
    if (projectId) {
      const autoConnect = async () => {
        try {
          await connect();
          console.log("Автоматически подключено к совместному редактированию");
        } catch (error) {
          console.warn(
            "Не удалось автоматически подключиться к совместному редактированию:",
            error
          );
        }
      };

      autoConnect();
    }
  }, [connect, projectId]);

  const buttonStyle = {
    marginRight: "10px",
    backgroundColor: "#7d3cff",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
    transition: "background-color 0.3s ease",
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#666",
    cursor: "not-allowed",
    opacity: 0.6,
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
        <div>Loading project...</div>
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
        }}
      >
        <button
          style={{
            ...buttonStyle,
            width: "140px",
            padding: "0",
            justifyContent: "center",
          }}
          onClick={handleBackToProjects}
        >
          ← Back
        </button>

        <div
          style={{
            marginLeft: "20px",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {projectName}
          {isShared && (
            <span
              style={{
                marginLeft: "10px",
                fontSize: "12px",
                opacity: 0.7,
                backgroundColor: "#333",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              Shared ({permission})
            </span>
          )}
        </div>

        <button
          style={canEdit ? buttonStyle : disabledButtonStyle}
          onClick={() => saveDiagramLocally(diagramRefObject)}
          disabled={!canEdit}
        >
          Сохранить локально
        </button>
        <button
          style={canEdit ? buttonStyle : disabledButtonStyle}
          onClick={() => loadDiagramLocally(diagramRefObject)}
          disabled={!canEdit}
        >
          Загрузить локально
        </button>

        <button
          style={canEdit ? buttonStyle : disabledButtonStyle}
          onClick={() => saveDiagramServer(diagramRefObject, projectName)}
          disabled={!canEdit}
        >
          Сохранить на сервер
        </button>
        <button
          style={canEdit ? buttonStyle : disabledButtonStyle}
          onClick={() => loadDiagramServer(diagramRefObject, projectName)}
          disabled={!canEdit}
        >
          Загрузить с сервера
        </button>

        <button
          style={canEdit ? buttonStyle : disabledButtonStyle}
          onClick={async () => {
            await saveDiagramServer(diagramRefObject, projectName);
            setIsChatOpen(true);
          }}
          disabled={!canEdit}
        >
          Запустить бота
        </button>

        {/* Переключатель совместного редактирования */}
        <button
          style={{
            ...buttonStyle,
            backgroundColor: isConnected ? "#4CAF50" : "#F44336",
            marginLeft: "auto",
          }}
          onClick={() => setShowCollaborativeUI(!showCollaborativeUI)}
        >
          {isConnected ? "Совместное" : "Подключить"} Редактирование
        </button>

        {/* Переключатель управления пользователями */}
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#FF9800",
          }}
          onClick={() => setShowUserManager(!showUserManager)}
        >
          Пользователи
        </button>
      </div>

      <div style={{ display: "flex", height: "100vh", gap: "0px" }}>
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
            background: "#1e1e1e",
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        ></div>
      </div>

      {/* User Manager */}
      {showUserManager && (
        <UserManager onUserChange={handleUserChange} currentUserId={userId} />
      )}

      {/* Collaborative Editing UI */}
      {showCollaborativeUI && (
        <CollaborativeEditingUI
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          activeUsers={activeUsers}
          error={error}
          onConnect={connect}
          onDisconnect={disconnect}
          projectId={projectId}
          userId={userId}
        />
      )}

      {/* Chat Preview */}
      {isChatOpen && (
        <div
          id="chat-container"
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: "300px",
            background: "#1e1e1e",
            color: "#fff",
            boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.5)",
            zIndex: 101,
          }}
        >
          <ChatPreview onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </>
  );
};

export default Diagram;
