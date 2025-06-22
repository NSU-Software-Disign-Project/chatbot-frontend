import * as go from "gojs";
import createPort from "./createPort";
import { nodeContextMenu } from "./diagram";

const $ = go.GraphObject.make;

export const createOptionsBlock = (diagram) => {
  return $(
    go.Node,
    "Auto",
    { contextMenu: nodeContextMenu },
    // Background and border
    $(go.Shape, "RoundedRectangle", {
      fill: "rgba(254, 242, 67, 0.25)", // Жёлтый фон с прозрачностью
      stroke: "#ffcc00", // Ярко-желтая обводка
      strokeWidth: 2,
    }),
    // Content panel using Table layout like other blocks
    $(go.Panel, "Table")
      .addColumnDefinition(0, { alignment: go.Spot.Left })
      .addColumnDefinition(1, { alignment: go.Spot.Center })
      .addColumnDefinition(2, { alignment: go.Spot.Right })
      .add(
        // Block title
        new go.TextBlock({
          column: 0,
          row: 0,
          columnSpan: 3,
          alignment: go.Spot.Center,
          text: "Options Block",
          font: "bold 14pt sans-serif",
          margin: new go.Margin(8, 16),
          stroke: "#fff", // Белый текст
        }),
        // Input port on the left
        new go.Panel("Horizontal", { column: 0, row: 1 }).add(
          createPort("IN", go.Spot.Left, true, "#ffcc00")
        ),
        // Options panel in the center
        $(
          go.Panel,
          "Vertical",
          {
            column: 1,
            row: 1,
            alignment: go.Spot.Center,
            name: "OPTIONS_PANEL",
            defaultAlignment: go.Spot.Left,
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(10, 0),
          },
          new go.Binding("itemArray", "options").makeTwoWay(),
          {
            itemTemplate: $(
              go.Panel,
              "Horizontal",
              { alignment: go.Spot.Right, margin: new go.Margin(2, 0) },
              $(
                go.TextBlock,
                {
                  font: "bold 12pt sans-serif",
                  stroke: "#fff", // Белый текст
                  editable: true,
                  isMultiline: false,
                  margin: new go.Margin(2, 10, 2, 0),
                },
                new go.Binding("text", "text").makeTwoWay()
              ),
              // Output port on the right using createPort function
              $(
                go.Shape,
                "Circle",
                {
                  width: 8,
                  height: 8,
                  fill: "#ffcc00",
                  stroke: null,
                  portId: "", // Will be bound
                  fromSpot: go.Spot.Right,
                  fromLinkable: true,
                  toLinkable: false,
                  toMaxLinks: 0,
                  fromMaxLinks: 10,
                  cursor: "pointer",
                },
                new go.Binding("portId", "portId")
              )
            ),
          }
        )
      ),
    {
      contextMenu: $(
        go.Adornment,
        "Vertical",
        $(
          "ContextMenuButton",
          $(go.TextBlock, "Добавить опцию", { stroke: "#333" }),
          {
            click: (e, obj) => {
              const node = obj.part;
              const model = diagram.model;

              model.startTransaction("Добавить опцию");
              const options = node.data.options || [];
              const newPortId = `OUT${options.length}`;
              const newOption = {
                text: `Option ${options.length + 1}`,
                portId: newPortId,
              };
              model.setDataProperty(node.data, "options", [
                ...options,
                newOption,
              ]);
              model.commitTransaction("Добавить опцию");
            },
          }
        ),
        $(
          "ContextMenuButton",
          $(go.TextBlock, "Убрать опцию", { stroke: "#333" }),
          {
            click: (e, obj) => {
              const node = obj.part;
              const model = diagram.model;

              model.startTransaction("Убрать опцию");
              const options = node.data.options || [];
              if (options.length > 0) {
                options.pop();
                model.setDataProperty(node.data, "options", [...options]);
              }
              model.commitTransaction("Убрать опцию");
            },
          }
        ),
        $("ContextMenuButton", $(go.TextBlock, "Удалить блок"), {
          click: (e, obj) => {
            const node = obj.part;
            if (node !== null) {
              const diagram = node.diagram;
              if (diagram && diagram.commandHandler) {
                // Clear current selection first
                diagram.clearSelection();
                // Select only this specific node
                diagram.select(node);
                // Use the command handler to delete (this will trigger collaborative editing)
                diagram.commandHandler.deleteSelection();
              }
            }
          },
        })
      ),
    }
  );
};
