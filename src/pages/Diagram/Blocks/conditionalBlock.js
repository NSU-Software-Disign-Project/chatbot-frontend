import * as go from "gojs";
import createPort from "./createPort";
import { nodeContextMenu } from "./diagram";

const $ = go.GraphObject.make;

export const createConditionalBlock = (diagram) => {
  return $(
    go.Node,
    "Auto",
    { contextMenu: nodeContextMenu },
    // Background and border
    $(go.Shape, "RoundedRectangle", {
      fill: "#6a1b1b", // Темный красный фон
      stroke: "#ff0000", // Яркая обводка
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
          text: "Conditional Block",
          font: "bold 14pt sans-serif",
          margin: new go.Margin(8, 16),
          stroke: "#fff", // Белый текст
        }),
        // Input port on the left
        new go.Panel("Horizontal", { column: 0, row: 1 }).add(
          createPort("IN", go.Spot.Left, true, "red")
        ),
        // Variable name field in the center
        $(
          go.TextBlock,
          {
            column: 1,
            row: 1,
            editable: true,
            isMultiline: false,
            alignment: go.Spot.Center,
            font: "bold 12pt sans-serif",
            margin: new go.Margin(8, 32),
            stroke: "#fff", // Белый текст
          },
          new go.Binding("text", "variableName").makeTwoWay()
        ),
        // Conditions panel in the center (below variable name)
        $(
          go.Panel,
          "Vertical",
          {
            column: 1,
            row: 2,
            alignment: go.Spot.Center,
            name: "CONDITIONS_PANEL",
            defaultAlignment: go.Spot.Left,
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(10, 0),
          },
          new go.Binding("itemArray", "conditions").makeTwoWay(),
          {
            itemTemplate: $(
              go.Panel,
              "Horizontal",
              { alignment: go.Spot.Right, margin: new go.Margin(2, 0) },
              $(
                go.TextBlock,
                {
                  font: "bold 10pt sans-serif", // Увеличенный шрифт
                  stroke: "#fff", // Белый текст
                  editable: true,
                  isMultiline: false,
                  margin: new go.Margin(2, 10, 2, 0),
                },
                new go.Binding("text", "text").makeTwoWay()
              ),
              $(
                go.Shape,
                "Circle",
                {
                  width: 8,
                  height: 8,
                  fill: "red",
                  stroke: null,
                  fromSpot: go.Spot.Right,
                  fromLinkable: true,
                  toLinkable: false,
                  toMaxLinks: 0,
                  fromMaxLinks: 10,
                  cursor: "pointer",
                  portId: "", // This will be bound to the portId from the data
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
        $("ContextMenuButton", $(go.TextBlock, "Добавить условие"), {
          click: (e, obj) => {
            const node = obj.part;
            const model = diagram.model;

            model.startTransaction("Добавить условие");

            const conditions = node.data.conditions || [];
            const newPortId = `OUT${conditions.length}`;
            const newCondition = {
              text: `Condition ${conditions.length + 1}`,
              portId: newPortId,
            };

            model.setDataProperty(node.data, "conditions", [
              ...conditions,
              newCondition,
            ]);

            model.commitTransaction("Добавить условие");
          },
        }),
        $("ContextMenuButton", $(go.TextBlock, "Убрать условие"), {
          click: (e, obj) => {
            const node = obj.part; // Текущий узел
            const model = diagram.model;

            model.startTransaction("Убрать условие");

            const conditions = node.data.conditions || [];
            if (conditions.length > 0) {
              conditions.pop();
              model.setDataProperty(node.data, "conditions", [...conditions]);
            }

            model.commitTransaction("Убрать условие");
          },
        }),
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
