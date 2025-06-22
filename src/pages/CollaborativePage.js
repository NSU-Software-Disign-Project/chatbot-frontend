/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as go from "gojs";
import saveBlock from "./Diagram/Blocks/saveBlock";
import messageBlock from "./Diagram/Blocks/messageBlock";
import apiBlock from "./Diagram/Blocks/apiBlock";
import startBlock from "./Diagram/Blocks/startBlock";
import { createConditionalBlock } from "./Diagram/Blocks/conditionalBlock";
import { createOptionsBlock } from "./Diagram/Blocks/optionsBlock";
import { createDiagram } from "./Diagram/Blocks/diagram";
import {
  saveDiagramServer,
  loadDiagramServer,
  saveDiagramLocally,
  loadDiagramLocally,
  transformToServerFormat,
  transformToGoJSFormat,
} from "./Diagram/SaveLoad";
import ChatPreview from "./Messenger/ChatPreview";
import GoJSCollaborativeIntegration from "../services/GoJSCollaborativeIntegration";
import collaborativeEditingService from "../services/CollaborativeEditingService";

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
  const [dataLoaded, setDataLoaded] = useState(false); // Track if any data has been loaded

  // Additional state for enhanced features
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShared] = useState(false);
  const [permission] = useState("admin");

  // Store received project data for loading when diagram is ready
  const [pendingProjectData, setPendingProjectData] = useState(null);

  // GoJS collaborative integration
  const gojsIntegrationRef = useRef(null);

  // Track initialization to prevent multiple initializations
  const initializationRef = useRef(false);

  // Auto-load attempted flag
  const autoLoadAttemptedRef = useRef(false);

  // Auto-save functionality
  const autoSaveDiagram = async () => {
    console.log("💾 [autoSaveDiagram] Called with:", {
      shareToken,
      hasDiagram: !!diagramRefObject.current,
      diagramModel: diagramRefObject.current?.model,
    });

    if (diagramRefObject.current && shareToken) {
      try {
        const json = diagramRefObject.current.model.toJson();
        console.log("💾 [autoSaveDiagram] Current diagram JSON:", json);

        const parsedJson = JSON.parse(json);
        console.log("💾 [autoSaveDiagram] Parsed JSON:", parsedJson);

        const transformedData = transformToServerFormat(parsedJson);
        console.log(
          "💾 [autoSaveDiagram] Transformed data to send:",
          transformedData
        );

        // Validate data before sending
        if (
          !transformedData.nodeDataArray ||
          transformedData.nodeDataArray.length === 0
        ) {
          console.warn("💾 [autoSaveDiagram] No valid nodes to save, skipping");
          return;
        }

        console.log("💾 [autoSaveDiagram] Sending PUT to backend...");
        const response = await fetch(
          `http://localhost:8080/api/collaborative/project/${shareToken}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedData),
          }
        );

        console.log("💾 [autoSaveDiagram] Response status:", response.status);

        if (response.ok) {
          const result = await response.json();
          console.log("💾 [autoSaveDiagram] Save successful:", result);
        } else {
          const errorText = await response.text();
          console.warn(
            "💾 [autoSaveDiagram] Save failed:",
            response.status,
            errorText
          );
        }
      } catch (error) {
        console.error("💾 [autoSaveDiagram] Save failed:", error);
      }
    } else {
      console.log(
        "💾 [autoSaveDiagram] Skipped - missing diagram or shareToken:",
        {
          hasDiagram: !!diagramRefObject.current,
          shareToken,
        }
      );
    }
  };

  // Debounced auto-save to prevent too many save operations
  const debouncedAutoSave = useRef(null);
  const debouncedAutoSaveDiagram = () => {
    console.log("⏰ [debouncedAutoSaveDiagram] Called");
    if (debouncedAutoSave.current) {
      clearTimeout(debouncedAutoSave.current);
    }
    debouncedAutoSave.current = setTimeout(() => {
      console.log(
        "⏰ [debouncedAutoSaveDiagram] Executing auto-save after delay"
      );
      autoSaveDiagram();
    }, 1000); // Save after 1 second of no changes
  };

  // Auto-load functionality
  const autoLoadDiagram = async () => {
    console.log("🔄 Auto-load starting with:", {
      shareToken,
      hasDiagram: !!diagramRefObject.current,
      diagramModel: diagramRefObject.current?.model,
    });

    if (shareToken && diagramRefObject.current) {
      try {
        console.log("🔄 Auto-loading diagram data from collaborative API...");
        const response = await fetch(
          `http://localhost:8080/api/collaborative/project/${shareToken}`
        );

        console.log("🔄 Auto-load response status:", response.status);

        if (response.ok) {
          const projectData = await response.json();
          console.log("🔄 Auto-load data received:", projectData);
          console.log("🔄 Auto-load data structure:", {
            hasData: !!projectData.data,
            nodeDataArray: projectData.data?.nodeDataArray,
            linkDataArray: projectData.data?.linkDataArray,
            nodeCount: projectData.data?.nodeDataArray?.length || 0,
            linkCount: projectData.data?.linkDataArray?.length || 0,
          });

          if (projectData.data && projectData.data.nodeDataArray) {
            const { nodeDataArray, linkDataArray } = projectData.data;
            console.log(
              `🔄 Auto-loading: ${nodeDataArray?.length || 0} nodes, ${
                linkDataArray?.length || 0
              } links`
            );

            if (nodeDataArray && nodeDataArray.length > 0) {
              setDataLoaded(true);
              if (dataLoaded) return; // Never overwrite model if dataLoaded is true

              // Also check if diagram already has data
              if (
                diagramRefObject.current.model &&
                diagramRefObject.current.model.nodeDataArray.length > 0
              ) {
                console.log("🔄 Diagram already has data, skipping auto-load");
                return;
              }

              console.log("🔄 About to set diagram model with data:", {
                nodeDataArray: nodeDataArray,
                linkDataArray: linkDataArray,
              });

              // Use the proper transformation function to convert backend format to GoJS format
              const transformedData = transformToGoJSFormat(projectData);
              console.log("🔄 Transformed data for GoJS:", transformedData);

              diagramRefObject.current.model =
                go.Model.fromJson(transformedData);
              console.log("🔄 Auto-load successful");
              console.log("🔄 Diagram model after loading:", {
                nodeCount: diagramRefObject.current.model.nodeDataArray.length,
                linkCount: diagramRefObject.current.model.linkDataArray.length,
                nodes: diagramRefObject.current.model.nodeDataArray,
              });
              diagramRefObject.current.layoutDiagram(true);
            } else {
              console.log("🔄 No nodes in auto-load data");
            }
          } else {
            console.log("🔄 No data structure in auto-load response");
          }
        } else {
          console.warn("🔄 Auto-load failed with status:", response.status);
        }
      } catch (error) {
        console.error("🔄 Auto-load failed:", error);
      }
    } else {
      console.log("🔄 Auto-load skipped - missing shareToken or diagram:", {
        shareToken,
        hasDiagram: !!diagramRefObject.current,
      });
    }
  };

  // Reset auto-load attempt when shareToken changes
  useEffect(() => {
    autoLoadAttemptedRef.current = false;
    setDataLoaded(false);
    initializationRef.current = false; // Reset initialization flag for new projects
    setPendingProjectData(null); // Clear pending data for new projects

    // Clean up previous collaborative editing connection
    if (collaborativeEditingService.socket) {
      collaborativeEditingService.disconnect();
    }
  }, [shareToken]);

  // Initialize connection status on mount
  useEffect(() => {
    // Set initial connection status
    setConnectionStatus("disconnected");
    setIsConnected(false);
  }, []);

  // Initialize collaborative editing
  useEffect(() => {
    // Add global error handler to suppress DOM removal errors
    const originalErrorHandler = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      // Suppress specific DOM removal errors from GoJS
      if (
        message &&
        typeof message === "string" &&
        (message.includes("removeChild") || message.includes("NotFoundError"))
      ) {
        console.warn("Suppressed DOM removal error:", message);
        return true; // Prevent error from being logged
      }

      // Call original error handler for other errors
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    // Prevent multiple initializations
    if (initializationRef.current) {
      console.log("🚀 Already initialized, skipping...");
      return;
    }

    // Safety timeout to ensure loading is always cleared
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log("⚠️ Safety timeout: clearing loading state");
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    const initializeCollaborativeEditing = async () => {
      try {
        initializationRef.current = true; // Mark as initialized
        setLoading(true);
        setError(null);

        console.log("🚀 Starting collaborative editing initialization...");
        console.log("🚀 ShareToken:", shareToken);

        // Check if shareToken exists
        if (!shareToken) {
          console.error("🚀 No shareToken provided");
          setError("No share token provided");
          setLoading(false);
          return;
        }

        // Test REST API endpoint first
        try {
          console.log("🧪 Testing REST API endpoint...");
          const testResponse = await fetch(
            `http://localhost:8080/api/collaborative/project/${shareToken}`
          );
          console.log("🧪 REST API test response status:", testResponse.status);
          if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log("🧪 REST API test data:", testData);
          } else {
            console.warn("🧪 REST API test failed:", testResponse.status);
          }
        } catch (testError) {
          console.error("🧪 REST API test error:", testError);
        }

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
        try {
          await collaborativeEditingService.connectWithShareToken(
            shareToken,
            username
          );
          setIsConnected(true);
          setConnectionStatus("connected");
          console.log("✅ Successfully connected to collaborative editing");
        } catch (connectionError) {
          console.warn(
            "⚠️ Failed to connect to collaborative editing:",
            connectionError
          );
          setIsConnected(false);
          setConnectionStatus("disconnected");
          // Continue with data loading even if connection failed
        }

        // Set up event listeners for connection status changes
        collaborativeEditingService.onConnectionStatus((status) => {
          setConnectionStatus(status);
          setIsConnected(status === "connected");

          // Re-setup collaborative integration when connection status changes
          if (
            status === "connected" &&
            diagramRefObject.current &&
            !gojsIntegrationRef.current
          ) {
            console.log(
              "🔧 Re-setting up collaborative editing integration after connection..."
            );
            gojsIntegrationRef.current = new GoJSCollaborativeIntegration(
              diagramRefObject.current,
              {
                onNodeDelete: () => {
                  autoSaveDiagram();
                },
                onNodeAdd: () => {
                  console.log("📤 Node added, triggering auto-save");
                  autoSaveDiagram();
                },
              }
            );
            gojsIntegrationRef.current.setupGoJSEventListeners();
            console.log(
              "✅ Collaborative editing integration re-setup successfully"
            );
          }
        });

        collaborativeEditingService.onUserJoined((data) => {
          setActiveUsers(collaborativeEditingService.getActiveUsers());
        });

        collaborativeEditingService.onUserLeft((data) => {
          setActiveUsers(collaborativeEditingService.getActiveUsers());
        });

        collaborativeEditingService.onEditOperation((operation) => {
          // Operation received, no need to track lastSyncTime
        });

        collaborativeEditingService.onProjectData((data) => {
          console.log("📥 Received project data from WebSocket:", data);
          setProjectName(data.projectName || "Untitled Project");

          // Store the data for loading when diagram is ready
          setPendingProjectData(data);

          // Only update the diagram if we have meaningful data and the diagram is ready
          if (diagramRefObject.current) {
            const currentModel = diagramRefObject.current.model;
            const currentNodes = currentModel ? currentModel.nodeDataArray : [];
            const currentLinks = currentModel ? currentModel.linkDataArray : [];

            // Check if the new data is different from current data
            const newNodes = data.nodeDataArray || [];
            const newLinks = data.linkDataArray || [];

            const nodesChanged =
              JSON.stringify(currentNodes) !== JSON.stringify(newNodes);
            const linksChanged =
              JSON.stringify(currentLinks) !== JSON.stringify(newLinks);

            if (nodesChanged || linksChanged) {
              console.log("📥 Data changed, updating diagram...");
              const transformedData = transformToGoJSFormat({
                data: { nodeDataArray: newNodes, linkDataArray: newLinks },
              });
              diagramRefObject.current.model =
                go.Model.fromJson(transformedData);
              diagramRefObject.current.layoutDiagram(true);
              setDataLoaded(true);
            }
          }
        });

        // Also load fresh data from REST API to ensure we have the latest data
        try {
          console.log("📡 Loading fresh project data from REST API...");
          const response = await fetch(
            `http://localhost:8080/api/collaborative/project/${shareToken}`
          );
          console.log("📡 REST API response status:", response.status);

          if (response.ok) {
            const projectData = await response.json();
            console.log("📡 Fresh project data from REST API:", projectData);
            console.log("📡 Project data structure:", {
              hasData: !!projectData.data,
              nodeDataArray: projectData.data?.nodeDataArray,
              linkDataArray: projectData.data?.linkDataArray,
              nodeCount: projectData.data?.nodeDataArray?.length || 0,
              linkCount: projectData.data?.linkDataArray?.length || 0,
            });

            // Load the fresh data into the diagram immediately
            if (diagramRefObject.current && projectData.data) {
              const { nodeDataArray, linkDataArray } = projectData.data;
              console.log(
                `📡 Loading fresh data: ${nodeDataArray?.length || 0} nodes, ${
                  linkDataArray?.length || 0
                } links`
              );

              // Only load if we have actual data
              if (nodeDataArray && nodeDataArray.length > 0) {
                console.log("📡 About to set diagram model with data:", {
                  nodeDataArray: nodeDataArray,
                  linkDataArray: linkDataArray,
                });

                // Use the proper transformation function to convert backend format to GoJS format
                const transformedData = transformToGoJSFormat(projectData);
                console.log("📡 Transformed data for GoJS:", transformedData);

                // Only set the model if the diagram doesn't already have data
                if (
                  !diagramRefObject.current.model ||
                  diagramRefObject.current.model.nodeDataArray.length === 0
                ) {
                  diagramRefObject.current.model =
                    go.Model.fromJson(transformedData);
                  console.log(
                    "📡 Successfully loaded fresh data from REST API"
                  );
                  console.log("📡 Diagram model after loading:", {
                    nodeCount:
                      diagramRefObject.current.model.nodeDataArray.length,
                    linkCount:
                      diagramRefObject.current.model.linkDataArray.length,
                    nodes: diagramRefObject.current.model.nodeDataArray,
                  });
                  // Force diagram to update display
                  diagramRefObject.current.layoutDiagram(true);
                  setDataLoaded(true); // Mark that we've loaded data
                } else {
                  console.log(
                    "📡 Diagram already has data, skipping REST API load"
                  );
                }
              } else {
                console.log(
                  "📡 No nodes in REST API data, will wait for WebSocket data"
                );
              }
            } else {
              console.log(
                "📡 Diagram not ready yet, will load data when ready"
              );
            }
          } else {
            console.warn(
              "Failed to load fresh data from REST API:",
              response.status
            );
          }
        } catch (error) {
          console.warn("Error loading fresh data from REST API:", error);
        }

        // Always set loading to false after initialization is complete
        setLoading(false);
        console.log("🚀 Collaborative editing initialization complete");
      } catch (error) {
        console.error(
          "🚀 Error during collaborative editing initialization:",
          error
        );
        setError(error.message);
        setLoading(false);
      }
    };

    initializeCollaborativeEditing();

    // Cleanup function
    return () => {
      clearTimeout(safetyTimeout);
      console.log("🧹 Cleaning up collaborative editing initialization");
      initializationRef.current = false; // Reset initialization flag

      // Restore original error handler
      window.onerror = null;

      // Clean up diagram
      if (diagramRefObject.current) {
        try {
          // Stop any active text editing before cleanup
          if (diagramRefObject.current.toolManager) {
            const currentTool =
              diagramRefObject.current.toolManager.currentTool;
            if (currentTool && currentTool.name === "TextEditing") {
              console.log("Stopping active text editing tool during cleanup");
              try {
                currentTool.stopTool();
              } catch (error) {
                console.warn(
                  "Error stopping text editing tool during cleanup:",
                  error
                );
              }
            }
          }

          // Clear the model data instead of setting to null
          if (diagramRefObject.current.model) {
            diagramRefObject.current.model.nodeDataArray = [];
            diagramRefObject.current.model.linkDataArray = [];
          }

          // Safely destroy the diagram
          try {
            diagramRefObject.current.div = null;
          } catch (error) {
            console.warn("Error destroying diagram during cleanup:", error);
          }
        } catch (error) {
          console.warn("Error clearing diagram model during cleanup:", error);
        }
        diagramRefObject.current = null;
      }

      collaborativeEditingService.disconnect();
    };
  }, [shareToken]);

  // Fallback: Ensure loading is set to false after a maximum timeout
  useEffect(() => {
    const maxLoadingTimeout = setTimeout(() => {
      if (loading) {
        console.log(
          "⏰ Maximum loading timeout reached, forcing loading to false"
        );
        setLoading(false);
      }
    }, 10000); // 10 second maximum loading time

    return () => clearTimeout(maxLoadingTimeout);
  }, [loading]);

  // Force GoJS components to resize properly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (diagramRefObject.current) {
        diagramRefObject.current.div.style.width = "100%";
        diagramRefObject.current.div.style.height = "100%";
        diagramRefObject.current.layoutDiagram(true);
      }

      // Find the palette and resize it
      if (paletteRef.current) {
        const paletteDiv = paletteRef.current.querySelector("div");
        if (paletteDiv) {
          paletteDiv.style.width = "100%";
          paletteDiv.style.height = "100%";
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Initialize GoJS diagram
  useEffect(() => {
    // Only create diagram after collaborative editing is initialized
    if (!shareToken) return;

    const timer = setTimeout(() => {
      const $ = go.GraphObject.make;
      let diagram;
      let palette;

      // Check if diagram already exists and clean it up
      if (diagramRefObject.current) {
        // Check if text editing is active and wait if needed
        if (diagramRefObject.current.toolManager) {
          const currentTool = diagramRefObject.current.toolManager.currentTool;
          if (currentTool && currentTool.name === "TextEditing") {
            console.log("Text editing is active, delaying diagram recreation");
            // Wait a bit for text editing to complete
            setTimeout(() => {
              // Retry the diagram initialization
              const retryTimer = setTimeout(() => {
                // This will trigger the useEffect again
                console.log(
                  "Retrying diagram initialization after text editing"
                );
              }, 100);
              return () => clearTimeout(retryTimer);
            }, 500);
            return;
          }
        }

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

      // Set initial model with a clean, empty diagram
      if (!diagram.model || diagram.model.nodeDataArray.length === 0) {
        diagram.model = new go.GraphLinksModel({
          linkFromPortIdProperty: "fromPort",
          linkToPortIdProperty: "toPort",
          nodeDataArray: [],
          linkDataArray: [],
        });
      }

      // Store diagram reference
      diagramRefObject.current = diagram;
      console.log("🎯 Diagram created and stored in ref:", {
        hasModel: !!diagram.model,
        nodeCount: diagram.model ? diagram.model.nodeDataArray.length : 0,
        linkCount: diagram.model ? diagram.model.linkDataArray.length : 0,
      });

      // Set up collaborative editing integration AFTER templates are added
      if (isConnected && diagram) {
        console.log("🔧 Setting up collaborative editing integration...");
        gojsIntegrationRef.current = new GoJSCollaborativeIntegration(diagram, {
          onNodeDelete: () => {
            autoSaveDiagram();
          },
          onNodeAdd: () => {
            console.log("📤 Node added, triggering auto-save");
            autoSaveDiagram();
          },
        });
        gojsIntegrationRef.current.setupGoJSEventListeners();
        console.log("✅ Collaborative editing integration set up successfully");
      }

      // Add diagram change listeners for auto-save
      diagram.addDiagramListener("ChangedSelection", debouncedAutoSaveDiagram);
      diagram.addDiagramListener("SelectionDeleted", debouncedAutoSaveDiagram);
      diagram.addDiagramListener("SelectionMoved", debouncedAutoSaveDiagram);
      diagram.addDiagramListener("TextEdited", debouncedAutoSaveDiagram);
      // Robust: auto-save on any model change (add/remove/edit)
      diagram.addModelChangedListener((e) => {
        console.log("🔄 [addModelChangedListener] Model changed:", e);
        console.log("🔄 [addModelChangedListener] Change type:", e.modelChange);
        console.log("🔄 [addModelChangedListener] Change object:", e.object);
        console.log(
          "🔄 [addModelChangedListener] Change property name:",
          e.propertyName
        );

        // Always trigger auto-save for any model change
        console.log(
          "🔄 [addModelChangedListener] Triggering auto-save for change:",
          e.modelChange
        );
        debouncedAutoSaveDiagram();
      });

      // Auto-load data when diagram is ready - with better timing
      console.log("🎯 Diagram ready, checking if auto-load is needed...");
      if (dataLoaded || autoLoadAttemptedRef.current) return;
      autoLoadAttemptedRef.current = true;

      // First, try to load pending data from WebSocket
      if (
        pendingProjectData &&
        pendingProjectData.nodeDataArray &&
        pendingProjectData.nodeDataArray.length > 0
      ) {
        console.log(
          "🎯 Loading pending project data from WebSocket:",
          pendingProjectData
        );
        const transformedData = transformToGoJSFormat({
          data: {
            nodeDataArray: pendingProjectData.nodeDataArray,
            linkDataArray: pendingProjectData.linkDataArray,
          },
        });
        diagram.model = go.Model.fromJson(transformedData);
        diagram.layoutDiagram(true);
        setDataLoaded(true);
        setPendingProjectData(null); // Clear pending data
        console.log("🎯 Successfully loaded pending project data");
        return;
      }

      // If no pending data, try to load from REST API
      if (diagram.model.nodeDataArray.length === 0 && shareToken) {
        setTimeout(() => {
          autoLoadDiagram();
        }, 1000); // Reduced delay since diagram is now ready
      } else {
        console.log(
          "🎯 Diagram already has data or no shareToken, skipping auto-load"
        );
      }
      // Fallback: If collaborative connection failed, still try to load data
      if (!isConnected && shareToken) {
        setTimeout(() => {
          autoLoadDiagram();
        }, 2000);
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
            {
              category: "optionsBlock",
              options: [{ text: "Option 1", portId: "OUT0" }],
            },
            { category: "saveBlock", variableName: "variable name" },
          ];

          palette.model = new go.GraphLinksModel({
            nodeDataArray: nodeDataArray,
          });
        }
      }
    }, 500); // Increased delay to ensure DOM is ready

    // Copy paletteRef.current to a local variable for cleanup
    const paletteDiv = paletteRef.current;

    return () => {
      clearTimeout(timer);

      // Stop any active text editing before cleanup
      if (diagramRefObject.current && diagramRefObject.current.toolManager) {
        const currentTool = diagramRefObject.current.toolManager.currentTool;
        if (currentTool && currentTool.name === "TextEditing") {
          currentTool.stopTool();
        }
      }

      // Clean up collaborative editing integration
      if (gojsIntegrationRef.current) {
        gojsIntegrationRef.current.cleanup();
        gojsIntegrationRef.current = null;
      }

      // Clean up diagram
      if (diagramRefObject.current) {
        try {
          // Stop any active text editing before cleanup
          if (diagramRefObject.current.toolManager) {
            const currentTool =
              diagramRefObject.current.toolManager.currentTool;
            if (currentTool && currentTool.name === "TextEditing") {
              console.log("Stopping active text editing tool during cleanup");
              try {
                currentTool.stopTool();
              } catch (error) {
                console.warn(
                  "Error stopping text editing tool during cleanup:",
                  error
                );
              }
            }
          }

          // Clear the model data instead of setting to null
          if (diagramRefObject.current.model) {
            diagramRefObject.current.model.nodeDataArray = [];
            diagramRefObject.current.model.linkDataArray = [];
          }

          // Safely destroy the diagram
          try {
            diagramRefObject.current.div = null;
          } catch (error) {
            console.warn("Error destroying diagram during cleanup:", error);
          }
        } catch (error) {
          console.warn("Error clearing diagram model during cleanup:", error);
        }
        diagramRefObject.current = null;
      }

      // Clean up palette using the local variable
      if (paletteDiv && paletteDiv.children.length > 0) {
        try {
          const existingPalette = go.Diagram.fromDiv(paletteDiv);
          if (existingPalette) {
            existingPalette.div = null;
          }
        } catch (error) {
          console.warn("Error cleaning up palette during cleanup:", error);
        }
        paletteDiv.innerHTML = "";
      }
    };
  }, [shareToken, isConnected]); // Depend on shareToken and connection status

  // Set up collaborative integration when connected
  useEffect(() => {
    if (
      isConnected &&
      diagramRefObject.current &&
      !gojsIntegrationRef.current
    ) {
      console.log("🔧 Setting up collaborative integration (useEffect)...");
      gojsIntegrationRef.current = new GoJSCollaborativeIntegration(
        diagramRefObject.current,
        {
          onNodeDelete: () => {
            autoSaveDiagram();
          },
          onNodeAdd: () => {
            console.log("📤 Node added, triggering auto-save");
            autoSaveDiagram();
          },
        }
      );
      gojsIntegrationRef.current.setupGoJSEventListeners();
      console.log(
        "✅ Collaborative integration set up successfully (useEffect)"
      );
    }
  }, [isConnected]); // Only depend on isConnected, not dataLoaded

  // Auto-load diagram data when shareToken is available and diagram is ready
  useEffect(() => {
    if (
      shareToken &&
      diagramRefObject.current &&
      !dataLoaded &&
      !autoLoadAttemptedRef.current
    ) {
      const diagram = diagramRefObject.current;
      if (diagram.model && diagram.model.nodeDataArray.length === 0) {
        console.log("🔄 Auto-load triggered from useEffect");
        autoLoadAttemptedRef.current = true;
        setTimeout(() => {
          autoLoadDiagram();
        }, 500);
      }
    }
  }, [shareToken, diagramRefObject.current]); // Depend on shareToken and diagram availability

  // Cleanup debounced auto-save on unmount
  useEffect(() => {
    return () => {
      if (debouncedAutoSave.current) {
        clearTimeout(debouncedAutoSave.current);
      }
    };
  }, []);

  // Load pending project data when diagram is ready
  useEffect(() => {
    if (pendingProjectData && diagramRefObject.current && !dataLoaded) {
      console.log(
        "🔄 Loading pending project data when diagram is ready:",
        pendingProjectData
      );
      const { nodeDataArray, linkDataArray } = pendingProjectData;

      if (nodeDataArray && nodeDataArray.length > 0) {
        const transformedData = transformToGoJSFormat({
          data: { nodeDataArray, linkDataArray },
        });
        diagramRefObject.current.model = go.Model.fromJson(transformedData);
        diagramRefObject.current.layoutDiagram(true);
        setDataLoaded(true);
        setPendingProjectData(null); // Clear pending data
        console.log("🔄 Successfully loaded pending project data");
      }
    }
  }, [pendingProjectData, diagramRefObject.current, dataLoaded]);

  const handleDisplayNameChange = (e) => {
    const newName = e.target.value;
    setDisplayName(newName);
  };

  const canEdit = permission === "edit" || permission === "admin";

  const handleBackToHome = () => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (token) {
      // If authenticated, go to projects page
      navigate("/me");
    } else {
      // If not authenticated, go to homepage
      navigate("/");
    }
  };

  // Button styles
  const buttonStyle = {
    backgroundColor: "#7d3cff",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    marginRight: "10px",
    transition: "background-color 0.3s ease",
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#666",
    cursor: "not-allowed",
    opacity: 0.6,
  };

  // Debug: Show loading state
  console.log("🔍 Current state:", {
    loading,
    error,
    shareToken,
    isConnected,
    dataLoaded,
  });

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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: "6px solid #7d3cff",
              borderTop: "6px solid #fff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: 18,
            }}
          />
          <div style={{ fontSize: 20, fontWeight: 500 }}>
            Connecting to collaborative workspace...
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
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
        <div style={{ marginBottom: "10px" }}>
          <button
            onClick={handleBackToHome}
            style={{
              backgroundColor: "#666",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            ← Back to Home
          </button>
          <button
            onClick={autoLoadDiagram}
            style={{
              backgroundColor: "#4CAF50",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            🔄 Load Data
          </button>
        </div>
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
      <style>
        {`
          /* Reset all GoJS canvas sizing */
          canvas {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
          }
          
          /* Force all GoJS containers to fill their parents */
          [ref="paletteRef"] > div,
          [ref="diagramRef"] > div {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
          }
        `}
      </style>
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
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Save/Load Buttons */}
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
            onClick={() => {
              setIsChatOpen(true);
            }}
            disabled={!canEdit}
          >
            Запустить бота
          </button>

          {/* Display Name Input + Connection Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ color: "#fff", fontSize: "14px" }}>
              Display Name:
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
            <span
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor:
                  connectionStatus === "connected"
                    ? "#4CAF50"
                    : connectionStatus === "connecting"
                    ? "#FF9800"
                    : connectionStatus === "reconnecting"
                    ? "#FF9800"
                    : "#F44336",
                color: "#fff",
                borderRadius: "12px",
                padding: "2px 12px",
                fontSize: "14px",
                fontWeight: 500,
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1 }}>●</span>
              {connectionStatus === "connected"
                ? `Connected as ${displayName || "(no name)"}`
                : connectionStatus === "connecting"
                ? `Connecting as ${displayName || "(no name)"}...`
                : connectionStatus === "reconnecting"
                ? `Reconnecting as ${displayName || "(no name)"}...`
                : `Disconnected as ${displayName || "(no name)"}`}
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
                  "Только вы"
                );
              })()}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          height: "93vh",
          gap: "10px",
          padding: "10px",
          backgroundColor: "#1e1e1e",
          transition: "all 0.3s ease",
          marginRight: isChatOpen ? "350px" : "0px", // Make space for chat
        }}
      >
        <div
          ref={paletteRef}
          style={{
            width: "240px",
            flexShrink: 0,
            background: "#1e1e1e",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            border: "2px solid #333",
            position: "relative",
          }}
        ></div>

        <div
          ref={diagramRef}
          style={{
            flex: 1,
            background: "#1e1e1e",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            border: "2px solid #333",
            position: "relative",
            minWidth: 0, // Allow flex item to shrink
          }}
        ></div>
      </div>

      {/* Chat Preview */}
      {isChatOpen && (
        <ChatPreview
          onClose={() => setIsChatOpen(false)}
          shareToken={shareToken}
        />
      )}
    </>
  );
};

export default CollaborativePage;
