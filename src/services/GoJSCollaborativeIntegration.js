import * as go from "gojs";
import collaborativeEditingService from "./CollaborativeEditingService";

class GoJSCollaborativeIntegration {
  constructor(diagram) {
    this.diagram = diagram;
    this.isLocalChange = false;
    this.listenerFunctions = {}; // Store listener function references
    this.setupCollaborativeEditing();
  }

  setupCollaborativeEditing() {
    // Listen for edit operations from other users
    collaborativeEditingService.onEditOperation((operation) => {
      this.handleRemoteEditOperation(operation);
    });
  }

  // Handle edit operations from other users
  handleRemoteEditOperation(operation) {
    if (!this.diagram) return;

    console.log("🔄 Received remote operation:", operation);

    this.isLocalChange = true; // Prevent sending back the same operation

    try {
      switch (operation.type) {
        case "nodeMove":
          this.handleNodeMove(operation.data);
          break;
        case "nodeAdd":
          this.handleNodeAdd(operation.data);
          break;
        case "nodeDelete":
          this.handleNodeDelete(operation.data);
          break;
        case "nodeUpdate":
          this.handleNodeUpdate(operation.data);
          break;
        case "linkAdd":
          this.handleLinkAdd(operation.data);
          break;
        case "linkDelete":
          this.handleLinkDelete(operation.data);
          break;
        case "textChange":
          this.handleTextChange(operation.data);
          break;
        case "portChange":
          this.handlePortChange(operation.data);
          break;
        default:
          console.warn("Unknown edit operation type:", operation.type);
      }
    } catch (error) {
      console.error("Error handling remote edit operation:", error);
    } finally {
      this.isLocalChange = false;
    }
  }

  // Handle node movement from other users
  handleNodeMove(data) {
    const { nodeId, x, y } = data;
    const node = this.diagram.findNodeForKey(nodeId);
    if (node) {
      this.diagram.model.setDataProperty(node.data, "loc", new go.Point(x, y));
    }
  }

  // Handle node addition from other users
  handleNodeAdd(data) {
    const nodeData = {
      key: this.generateUniqueKey(),
      ...data,
    };
    this.diagram.model.addNodeData(nodeData);
  }

  // Handle node deletion from other users
  handleNodeDelete(data) {
    const { nodeId } = data;
    const node = this.diagram.findNodeForKey(nodeId);
    if (node) {
      this.diagram.model.removeNodeData(node.data);
    }
  }

  // Handle node updates from other users
  handleNodeUpdate(data) {
    const { nodeId, ...updates } = data;
    const node = this.diagram.findNodeForKey(nodeId);
    if (node) {
      Object.keys(updates).forEach((key) => {
        this.diagram.model.setDataProperty(node.data, key, updates[key]);
      });
    }
  }

  // Handle link addition from other users
  handleLinkAdd(data) {
    const linkData = {
      key: this.generateUniqueKey(),
      ...data,
    };
    this.diagram.model.addLinkData(linkData);
  }

  // Handle link deletion from other users
  handleLinkDelete(data) {
    const { linkId } = data;
    const link = this.diagram.findLinkForKey(linkId);
    if (link) {
      this.diagram.model.removeLinkData(link.data);
    }
  }

  // Handle text changes from other users
  handleTextChange(data) {
    const { nodeId, text } = data;
    const node = this.diagram.findNodeForKey(nodeId);
    if (node) {
      this.diagram.model.setDataProperty(node.data, "message", text);
    }
  }

  // Handle port changes from other users
  handlePortChange(data) {
    const { nodeId, portId, value } = data;
    const node = this.diagram.findNodeForKey(nodeId);
    if (node) {
      // Handle different types of port changes based on node category
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

  // Generate unique key for new elements
  generateUniqueKey() {
    return Date.now() + Math.random();
  }

  // Set up GoJS event listeners for collaborative editing
  setupGoJSEventListeners() {
    if (!this.diagram) return;

    // Node movement
    this.listenerFunctions.selectionMoved = (e) => {
      if (this.isLocalChange) return;

      console.log("📤 Sending node move operation");
      e.subject.each((part) => {
        if (part instanceof go.Node) {
          const loc = part.location;
          collaborativeEditingService.sendNodeMove(part.key, loc.x, loc.y);
        }
      });
    };
    this.diagram.addDiagramListener(
      "SelectionMoved",
      this.listenerFunctions.selectionMoved
    );

    // Node addition, selection changes, model updates, and link creation
    this.listenerFunctions.changedSelection = (e) => {
      if (this.isLocalChange) return;

      e.subject.each((part) => {
        if (part instanceof go.Node) {
          // Handle new node creation
          if (part.data && !part.data._sentToCollaboration) {
            const nodeData = {
              category: part.data.category,
              message: part.data.message,
              variableName: part.data.variableName,
              url: part.data.url,
              conditions: part.data.conditions,
              options: part.data.options,
              loc: part.location,
            };
            collaborativeEditingService.sendNodeAdd(nodeData);
            // Mark as sent to prevent duplicate sends
            this.diagram.model.setDataProperty(
              part.data,
              "_sentToCollaboration",
              true
            );
          } else {
            // Handle existing node updates
            const updates = {
              message: part.data.message,
              variableName: part.data.variableName,
              url: part.data.url,
              conditions: part.data.conditions,
              options: part.data.options,
            };
            collaborativeEditingService.sendNodeUpdate(part.key, updates);
          }
        } else if (part instanceof go.Link) {
          // Handle new link creation
          if (part.data && !part.data._sentToCollaboration) {
            const linkData = {
              from: part.fromNode ? part.fromNode.key : null,
              to: part.toNode ? part.toNode.key : null,
              fromPort: part.fromPort ? part.fromPort.portId : null,
              toPort: part.toPort ? part.toPort.portId : null,
            };
            collaborativeEditingService.sendLinkAdd(linkData);
            // Mark as sent to prevent duplicate sends
            this.diagram.model.setDataProperty(
              part.data,
              "_sentToCollaboration",
              true
            );
          }
        }
      });
    };
    this.diagram.addDiagramListener(
      "ChangedSelection",
      this.listenerFunctions.changedSelection
    );

    // Node deletion
    this.listenerFunctions.selectionDeleted = (e) => {
      if (this.isLocalChange) return;

      e.subject.each((part) => {
        if (part instanceof go.Node) {
          collaborativeEditingService.sendNodeDelete(part.key);
        } else if (part instanceof go.Link) {
          collaborativeEditingService.sendLinkDelete(part.key);
        }
      });
    };
    this.diagram.addDiagramListener(
      "SelectionDeleted",
      this.listenerFunctions.selectionDeleted
    );

    // Text changes
    this.listenerFunctions.textEdited = (e) => {
      if (this.isLocalChange) return;

      const textBlock = e.subject;
      const node = textBlock.part;
      if (node instanceof go.Node) {
        collaborativeEditingService.sendTextChange(node.key, textBlock.text);
      }
    };
    this.diagram.addDiagramListener(
      "TextEdited",
      this.listenerFunctions.textEdited
    );
  }

  // Clean up event listeners
  cleanup() {
    if (this.diagram && this.listenerFunctions) {
      // Remove all diagram listeners using stored function references
      if (this.listenerFunctions.selectionMoved) {
        this.diagram.removeDiagramListener(
          "SelectionMoved",
          this.listenerFunctions.selectionMoved
        );
      }
      if (this.listenerFunctions.changedSelection) {
        this.diagram.removeDiagramListener(
          "ChangedSelection",
          this.listenerFunctions.changedSelection
        );
      }
      if (this.listenerFunctions.selectionDeleted) {
        this.diagram.removeDiagramListener(
          "SelectionDeleted",
          this.listenerFunctions.selectionDeleted
        );
      }
      if (this.listenerFunctions.textEdited) {
        this.diagram.removeDiagramListener(
          "TextEdited",
          this.listenerFunctions.textEdited
        );
      }

      // Clear the diagram reference
      this.diagram = null;
    }

    // Clear listener function references
    this.listenerFunctions = {};

    // Reset local change flag
    this.isLocalChange = false;
  }
}

export default GoJSCollaborativeIntegration;
