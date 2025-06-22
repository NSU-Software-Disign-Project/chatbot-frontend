import * as go from "gojs";

const $ = go.GraphObject.make;

export const nodeContextMenu = $(
  "ContextMenu",
  $("ContextMenuButton", $(go.TextBlock, "Delete"), {
    click: (e, obj) => {
      console.log("Delete button clicked");
      const node = obj.part;
      console.log("Node:", node);

      if (node !== null) {
        const diagram = node.diagram;
        console.log("Diagram:", diagram);
        console.log("Command handler:", diagram?.commandHandler);

        if (diagram && diagram.commandHandler) {
          try {
            // Clear current selection first
            diagram.clearSelection();
            // Select only this specific node
            diagram.select(node);
            console.log("Node selected, attempting to delete...");

            // Try direct removal first
            if (node.data && node.data.key) {
              console.log(
                "Attempting direct model removal for key:",
                node.data.key
              );
              diagram.model.removeNodeData(node.data);
            } else {
              // Fallback to command handler
              diagram.commandHandler.deleteSelection();
            }
            console.log("Delete command executed");
          } catch (error) {
            console.error("Error during delete:", error);
          }
        } else {
          console.error("Diagram or command handler not available");
        }
      } else {
        console.error("Node is null");
      }
    },
  })
);

export const createDiagram = (divRef) => {
  if (!divRef) {
    throw new Error("divRef должен быть валидным DOM-элементом.");
  }

  // Check if there's an existing diagram and stop any active text editing
  const existingDiagram = go.Diagram.fromDiv(divRef);
  if (existingDiagram && existingDiagram.toolManager) {
    const currentTool = existingDiagram.toolManager.currentTool;
    if (currentTool && currentTool.name === "TextEditing") {
      try {
        console.log("Stopping active text editing tool before cleanup");
        currentTool.stopTool();
      } catch (error) {
        console.warn("Error stopping text editing tool:", error);
      }
    }

    // Properly destroy the existing diagram
    try {
      existingDiagram.div = null;
    } catch (error) {
      console.warn("Error destroying existing diagram:", error);
    }
  }

  // Создаем и настраиваем диаграмму
  const diagram = $(go.Diagram, divRef, {
    "undoManager.isEnabled": true,
    "linkingTool.isEnabled": true,
    "relinkingTool.isEnabled": true,
    layout: $(go.LayeredDigraphLayout),
    allowDrop: true,
    "draggingTool.isGridSnapEnabled": false,
    // Set up command handler properly
    commandHandler: $(go.CommandHandler, {
      canDeleteSelection: function () {
        return true;
      },
      deleteSelection: function () {
        const selection = this.diagram.selection;
        if (selection.count > 0) {
          this.diagram.startTransaction("delete");
          selection.each((part) => {
            if (part instanceof go.Node) {
              this.diagram.remove(part);
            } else if (part instanceof go.Link) {
              this.diagram.remove(part);
            }
          });
          this.diagram.commitTransaction("delete");
        }
      },
    }),
  });

  // Start with a clean, empty diagram
  diagram.model = new go.GraphLinksModel([], []);

  return diagram;
};
