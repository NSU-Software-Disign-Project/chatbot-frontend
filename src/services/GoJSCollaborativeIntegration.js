import * as go from "gojs";
import collaborativeEditingService from "./CollaborativeEditingService";

class GoJSCollaborativeIntegration {
  constructor(diagram, { onNodeDelete, onNodeAdd } = {}) {
    this.diagram = diagram;
    this.isLocalChange = false;
    this.listenerFunctions = {};
    this.onNodeDelete = onNodeDelete;
    this.onNodeAdd = onNodeAdd;
    this.pendingOperations = new Map();
    this.operationQueue = [];
    this.isProcessingQueue = false;

    console.log("🔧 Initializing GoJS collaborative integration");
    this.setupCollaborativeEditing();
    this.setupNodeCreationHandling();
  }

  setupCollaborativeEditing() {
    if (!this.diagram) return;

    console.log("🔧 Setting up collaborative editing integration");

    // Override the command handler's deleteSelection method
    const originalDeleteSelection = this.diagram.commandHandler.deleteSelection;
    this.diagram.commandHandler.deleteSelection = () => {
      const selection = this.diagram.selection;
      if (selection.count > 0) {
        // Store the keys of items being deleted for collaborative editing
        const deletedKeys = [];
        selection.each((part) => {
          if (part.data && part.data.key) {
            deletedKeys.push({
              key: part.data.key,
              type: part instanceof go.Node ? "node" : "link",
            });
          }
        });

        // Call the original delete method
        originalDeleteSelection.call(this.diagram.commandHandler);

        // Send deletion notifications for collaborative editing
        deletedKeys.forEach(({ key, type }) => {
          if (type === "node") {
            console.log(`📤 Sending nodeDelete for key: ${key}`);
            collaborativeEditingService.sendNodeDelete(key);
          } else if (type === "link") {
            console.log(`📤 Sending linkDelete for key: ${key}`);
            collaborativeEditingService.sendLinkDelete(key);
          }
        });
      }
    };

    // Listen for edit operations from other users
    collaborativeEditingService.onEditOperation((operation) => {
      this.handleRemoteEditOperation(operation);
    });
  }

  setupNodeCreationHandling() {
    if (!this.diagram) return;

    // Override the model's addNodeData method to catch new nodes
    const originalAddNodeData = this.diagram.model.addNodeData;
    this.diagram.model.addNodeData = (nodeData) => {
      console.log("🔧 Node being added to model:", nodeData);

      // Ensure the node has a proper positive key
      if (!nodeData.key || nodeData.key < 0) {
        nodeData.key = Date.now() + Math.random();
        console.log(`Generated new key ${nodeData.key} for new node`);
      }

      // Call the original method
      const result = originalAddNodeData.call(this.diagram.model, nodeData);

      // If this is a local change (not from remote), send the node to other users IMMEDIATELY
      if (nodeData && !nodeData._sentToCollaboration) {
        console.log(
          "📤 IMMEDIATE: Sending nodeAdd for newly created node:",
          nodeData
        );
        const nodeDataToSend = {
          key: nodeData.key,
          category: nodeData.category,
          message: nodeData.message,
          variableName: nodeData.variableName,
          url: nodeData.url,
          conditions: nodeData.conditions,
          options: nodeData.options,
          loc: nodeData.loc,
          text: nodeData.text,
          startText: nodeData.startText,
        };

        // Send immediately without any delay
        collaborativeEditingService.sendNodeAdd(nodeDataToSend);

        // Mark as sent to prevent duplicate sends
        this.diagram.model.setDataProperty(
          nodeData,
          "_sentToCollaboration",
          true
        );

        // Trigger auto-save callback if provided
        if (this.onNodeAdd) {
          console.log("📤 Triggering onNodeAdd callback for auto-save");
          this.onNodeAdd(nodeData);
        }
      }

      return result;
    };

    // Override the model's addLinkData method to catch new links
    const originalAddLinkData = this.diagram.model.addLinkData;
    this.diagram.model.addLinkData = (linkData) => {
      console.log("🔧 Link being added to model:", linkData);

      // Ensure the link has a proper positive key
      if (!linkData.key || linkData.key < 0) {
        linkData.key = Date.now() + Math.random();
        console.log(`Generated new key ${linkData.key} for new link`);
      }

      // Call the original method
      const result = originalAddLinkData.call(this.diagram.model, linkData);

      // If this is a local change (not from remote), send the link to other users
      if (linkData && !linkData._sentToCollaboration) {
        console.log("📤 Sending linkAdd for newly created link:", linkData);
        const linkDataToSend = {
          key: linkData.key,
          from: linkData.from,
          to: linkData.to,
          fromPort: linkData.fromPort,
          toPort: linkData.toPort,
        };
        collaborativeEditingService.sendLinkAdd(linkDataToSend);

        // Mark as sent to prevent duplicate sends
        this.diagram.model.setDataProperty(
          linkData,
          "_sentToCollaboration",
          true
        );
      }

      return result;
    };

    // Override the model's removeNodeData method to catch node deletions
    const originalRemoveNodeData = this.diagram.model.removeNodeData;
    this.diagram.model.removeNodeData = (nodeData) => {
      console.log("🔧 Node being removed from model:", nodeData);

      // If this is a local change (not from remote), send the deletion to other users
      if (nodeData && !nodeData._sentToCollaboration) {
        console.log("📤 Sending nodeDelete for node:", nodeData.key);
        collaborativeEditingService.sendNodeDelete(nodeData.key);

        // Mark as sent to prevent duplicate sends
        this.diagram.model.setDataProperty(
          nodeData,
          "_sentToCollaboration",
          true
        );
      }

      // Call the original method
      return originalRemoveNodeData.call(this.diagram.model, nodeData);
    };

    // Override the model's removeLinkData method to catch link deletions
    const originalRemoveLinkData = this.diagram.model.removeLinkData;
    this.diagram.model.removeLinkData = (linkData) => {
      console.log("🔧 Link being removed from model:", linkData);

      // If this is a local change (not from remote), send the deletion to other users
      if (linkData && !linkData._sentToCollaboration) {
        console.log("📤 Sending linkDelete for link:", linkData.key);
        collaborativeEditingService.sendLinkDelete(linkData.key);

        // Mark as sent to prevent duplicate sends
        this.diagram.model.setDataProperty(
          linkData,
          "_sentToCollaboration",
          true
        );
      }

      // Call the original method
      return originalRemoveLinkData.call(this.diagram.model, linkData);
    };

    // Override the model's setDataProperty method to catch property changes
    const originalSetDataProperty = this.diagram.model.setDataProperty;
    this.diagram.model.setDataProperty = (data, propertyName, value) => {
      // Call the original method first
      const result = originalSetDataProperty.call(
        this.diagram.model,
        data,
        propertyName,
        value
      );

      // If this is a local change (not from remote), send property updates
      if (data && !propertyName.startsWith("_")) {
        // Don't send internal properties like _sentToCollaboration
        if (propertyName === "loc" && data.key) {
          // Handle location changes separately as nodeMove
          const loc = value;
          if (loc && typeof loc.x === "number" && typeof loc.y === "number") {
            console.log(
              `📤 Sending nodeMove for node ${data.key} to (${loc.x}, ${loc.y})`
            );
            collaborativeEditingService.sendNodeMove(data.key, loc.x, loc.y);
          }
        } else if (propertyName === "message" && data.key) {
          // Handle text changes
          console.log(`📤 Sending textChange for node ${data.key}: ${value}`);
          collaborativeEditingService.sendTextChange(data.key, value);
        } else if (propertyName === "conditions" && data.key) {
          // Handle conditional block changes
          console.log(
            `📤 Sending nodeUpdate for node ${data.key}, conditions updated`
          );
          collaborativeEditingService.sendNodeUpdate(data.key, {
            conditions: value,
          });
        } else if (propertyName === "options" && data.key) {
          // Handle options block changes
          console.log(
            `📤 Sending nodeUpdate for node ${data.key}, options updated`
          );
          collaborativeEditingService.sendNodeUpdate(data.key, {
            options: value,
          });
        } else if (propertyName === "variableName" && data.key) {
          // Handle variable name changes
          console.log(
            `📤 Sending nodeUpdate for node ${data.key}, variableName: ${value}`
          );
          collaborativeEditingService.sendNodeUpdate(data.key, {
            variableName: value,
          });
        } else if (propertyName === "url" && data.key) {
          // Handle URL changes
          console.log(
            `📤 Sending nodeUpdate for node ${data.key}, url: ${value}`
          );
          collaborativeEditingService.sendNodeUpdate(data.key, {
            url: value,
          });
        } else if (propertyName === "startText" && data.key) {
          // Handle start text changes
          console.log(
            `📤 Sending nodeUpdate for node ${data.key}, startText: ${value}`
          );
          collaborativeEditingService.sendNodeUpdate(data.key, {
            startText: value,
          });
        }
      }

      return result;
    };
  }

  // Handle edit operations from other users
  handleRemoteEditOperation(operation) {
    if (!this.diagram) return;

    console.log("🔄 Received remote operation:", operation);

    // Add to queue to ensure proper order
    this.operationQueue.push(operation);
    this.processOperationQueue();
  }

  async processOperationQueue() {
    if (this.isProcessingQueue || this.operationQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift();
      await this.processOperation(operation);
    }

    this.isProcessingQueue = false;
  }

  async processOperation(operation) {
    this.isLocalChange = true;

    try {
      switch (operation.type) {
        case "nodeMove":
          await this.handleNodeMove(operation.data);
          break;
        case "nodeAdd":
          await this.handleNodeAdd(operation.data);
          break;
        case "nodeDelete":
          await this.handleNodeDelete(operation.data);
          break;
        case "nodeUpdate":
          await this.handleNodeUpdate(operation.data);
          break;
        case "linkAdd":
          await this.handleLinkAdd(operation.data);
          break;
        case "linkDelete":
          await this.handleLinkDelete(operation.data);
          break;
        case "textChange":
          await this.handleTextChange(operation.data);
          break;
        case "portChange":
          await this.handlePortChange(operation.data);
          break;
        default:
          console.warn("Unknown edit operation type:", operation.type);
      }
    } catch (error) {
      console.error("Error processing remote edit operation:", error);
    } finally {
      this.isLocalChange = false;
    }
  }

  // Handle node movement from other users
  async handleNodeMove(data) {
    const { nodeId, x, y } = data;
    const node = this.diagram.findNodeForKey(nodeId);
    if (node) {
      this.diagram.model.setDataProperty(node.data, "loc", new go.Point(x, y));
    }
  }

  // Handle node addition from other users
  async handleNodeAdd(data) {
    console.log(`🔄 IMMEDIATE: handleNodeAdd called with data:`, data);

    // Check if node already exists
    const existingNode = this.diagram.findNodeForKey(data.key);
    if (existingNode) {
      console.log(`Node ${data.key} already exists, skipping add`);
      return;
    }

    // Generate a proper positive key if the incoming key is negative or invalid
    let nodeKey = data.key;
    if (!nodeKey || nodeKey < 0) {
      nodeKey = Date.now() + Math.random();
      console.log(
        `Generated new key ${nodeKey} for incoming node with key ${data.key}`
      );
    }

    const nodeData = {
      ...data,
      key: nodeKey,
      _sentToCollaboration: true, // Prevent sending back
    };

    console.log(`🔄 IMMEDIATE: Adding remote node to diagram:`, nodeData);
    console.log(`🔄 Diagram state before adding:`, {
      hasModel: !!this.diagram.model,
      nodeCount: this.diagram.model
        ? this.diagram.model.nodeDataArray.length
        : 0,
      templates: this.diagram.nodeTemplateMap
        ? Array.from(this.diagram.nodeTemplateMap.keys())
        : [],
    });

    try {
      // Add the node to the model IMMEDIATELY
      this.diagram.model.addNodeData(nodeData);

      console.log(`🔄 Diagram state after adding:`, {
        nodeCount: this.diagram.model.nodeDataArray.length,
        nodes: this.diagram.model.nodeDataArray,
      });

      // Force the diagram to update and layout IMMEDIATELY
      this.forceDiagramUpdate();

      // Verify the node was actually added
      const addedNode = this.diagram.findNodeForKey(nodeKey);
      if (addedNode) {
        console.log(
          `✅ IMMEDIATE: Remote node added successfully with key: ${nodeKey}`
        );
        console.log(`✅ Node found in diagram:`, addedNode.data);

        // Add visual feedback - highlight the new node briefly
        if (addedNode instanceof go.Node) {
          // Flash the node to indicate it was added remotely
          const originalStroke = addedNode.stroke;
          addedNode.stroke = "#00ff00"; // Green flash
          setTimeout(() => {
            addedNode.stroke = originalStroke;
          }, 1000);
        }

        // Ensure the node is visible and properly positioned
        if (addedNode.location) {
          console.log(`✅ Node positioned at:`, addedNode.location);
        }
      } else {
        console.error(
          `❌ Node with key ${nodeKey} was not found in diagram after adding!`
        );
        console.error(`❌ Available nodes:`, this.diagram.model.nodeDataArray);
      }
    } catch (error) {
      console.error(`❌ Error adding remote node:`, error);
    }
  }

  // Handle node deletion from other users
  async handleNodeDelete(data) {
    const { nodeId } = data;
    console.log(`🔄 Received remote nodeDelete for nodeId: ${nodeId}`);

    const node = this.diagram.findNodeForKey(nodeId);
    if (node) {
      console.log(`🗑️ Removing node with key: ${nodeId} from diagram`);
      this.diagram.model.removeNodeData(node.data);
    } else {
      console.log(`⚠️ Node with key: ${nodeId} not found in diagram`);
    }
  }

  // Handle node updates from other users
  async handleNodeUpdate(data) {
    const { nodeId, ...updates } = data;
    const node = this.diagram.findNodeForKey(nodeId);
    if (node) {
      Object.keys(updates).forEach((key) => {
        if (!key.startsWith("_")) {
          // Don't update internal properties
          this.diagram.model.setDataProperty(node.data, key, updates[key]);
        }
      });
    }
  }

  // Handle link addition from other users
  async handleLinkAdd(data) {
    // Check if link already exists
    const existingLink = this.diagram.findLinkForKey(data.key);
    if (existingLink) {
      console.log(`Link ${data.key} already exists, skipping add`);
      return;
    }

    // Generate a proper positive key if the incoming key is negative or invalid
    let linkKey = data.key;
    if (!linkKey || linkKey < 0) {
      linkKey = Date.now() + Math.random();
      console.log(
        `Generated new key ${linkKey} for incoming link with key ${data.key}`
      );
    }

    const linkData = {
      ...data,
      key: linkKey,
      _sentToCollaboration: true, // Prevent sending back
    };

    console.log(`🔄 Adding remote link to diagram:`, linkData);

    // Add the link to the model
    this.diagram.model.addLinkData(linkData);

    // Force the diagram to update and layout
    this.forceDiagramUpdate();

    console.log(`✅ Remote link added successfully with key: ${linkKey}`);
  }

  // Handle link deletion from other users
  async handleLinkDelete(data) {
    const { linkId } = data;
    const link = this.diagram.findLinkForKey(linkId);
    if (link) {
      this.diagram.model.removeLinkData(link.data);
    }
  }

  // Handle text changes from other users
  async handleTextChange(data) {
    const { nodeId, text } = data;
    const node = this.diagram.findNodeForKey(nodeId);
    if (node) {
      this.diagram.model.setDataProperty(node.data, "message", text);
    }
  }

  // Handle port changes from other users
  async handlePortChange(data) {
    const { nodeId, portId, value } = data;
    const node = this.diagram.findNodeForKey(nodeId);
    if (node) {
      const category = node.data.category;
      if (category === "conditionalBlock") {
        this.handleConditionalPortChange(node, portId, value);
      } else if (category === "optionsBlock") {
        this.handleOptionsPortChange(node, portId, value);
      }
    }
  }

  // Handle conditional block port changes
  handleConditionalPortChange(node, portId, value) {
    const conditions = node.data.conditions || [];
    const conditionIndex = conditions.findIndex((c) => c.portId === portId);
    if (conditionIndex !== -1) {
      const newConditions = [...conditions];
      newConditions[conditionIndex] = {
        ...newConditions[conditionIndex],
        ...value,
      };
      this.diagram.model.setDataProperty(
        node.data,
        "conditions",
        newConditions
      );
    }
  }

  // Handle options block port changes
  handleOptionsPortChange(node, portId, value) {
    const options = node.data.options || [];
    const optionIndex = options.findIndex((o) => o.portId === portId);
    if (optionIndex !== -1) {
      const newOptions = [...options];
      newOptions[optionIndex] = { ...newOptions[optionIndex], ...value };
      this.diagram.model.setDataProperty(node.data, "options", newOptions);
    }
  }

  // Set up GoJS event listeners for collaborative editing
  setupGoJSEventListeners() {
    if (!this.diagram) return;

    console.log("🔧 Setting up GoJS collaborative editing event listeners");

    // Node movement
    this.listenerFunctions.selectionMoved = (e) => {
      console.log("📤 Sending node move operation");
      e.subject.each((part) => {
        if (part instanceof go.Node) {
          const loc = part.location;
          collaborativeEditingService.sendNodeMove(part.data.key, loc.x, loc.y);
        }
      });
    };
    this.diagram.addDiagramListener(
      "SelectionMoved",
      this.listenerFunctions.selectionMoved
    );

    // Text editing
    this.listenerFunctions.textEdited = (e) => {
      const textBlock = e.subject;
      const node = textBlock.part;
      if (node instanceof go.Node) {
        console.log(`📤 Text edited for node with key: ${node.data.key}`);
        collaborativeEditingService.sendTextChange(
          node.data.key,
          textBlock.text
        );
      }
    };
    this.diagram.addDiagramListener(
      "TextEdited",
      this.listenerFunctions.textEdited
    );
  }

  // Clean up event listeners
  cleanup() {
    console.log("🧹 Cleaning up GoJS collaborative integration");

    if (this.diagram) {
      // Remove all event listeners
      Object.keys(this.listenerFunctions).forEach((eventName) => {
        if (this.listenerFunctions[eventName]) {
          this.diagram.removeDiagramListener(
            eventName,
            this.listenerFunctions[eventName]
          );
        }
      });
    }

    // Clear queues and pending operations
    this.operationQueue = [];
    this.pendingOperations.clear();
    this.isProcessingQueue = false;
    this.listenerFunctions = {};
  }

  // Get current state
  getState() {
    return {
      isLocalChange: this.isLocalChange,
      operationQueueLength: this.operationQueue.length,
      pendingOperationsCount: this.pendingOperations.size,
      isProcessingQueue: this.isProcessingQueue,
    };
  }

  // Force diagram to update and render
  forceDiagramUpdate() {
    if (this.diagram) {
      console.log("🔄 IMMEDIATE: Forcing diagram update and layout");

      // Force immediate update
      this.diagram.updateAllTargetBindings();
      this.diagram.invalidateDisplay();

      // Force layout update
      this.diagram.layoutDiagram(true);

      // Force another update to ensure everything is rendered
      setTimeout(() => {
        this.diagram.updateAllTargetBindings();
        this.diagram.invalidateDisplay();
      }, 10);

      console.log("✅ Diagram update completed");
    }
  }
}

export default GoJSCollaborativeIntegration;
