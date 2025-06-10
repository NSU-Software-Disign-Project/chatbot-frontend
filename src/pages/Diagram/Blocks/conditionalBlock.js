import * as go from "gojs";
import createPort from "./createPort";

const $ = go.GraphObject.make;

export const createConditionalBlock = (diagram) => {
  return $(
    go.Node,
    "Auto",
    $(
      go.Panel,
      "Auto",
      $(
        go.Shape,
        "RoundedRectangle",
        {
          fill: "#6a1b1b", // Темный красный фон
          stroke: "#ff0000", // Яркая обводка
          strokeWidth: 2,
        }
      ),
      $(
        go.Panel,
        "Vertical",
        { alignment: go.Spot.TopLeft, margin: 10 },
        $(
          go.TextBlock,
          {
            margin: new go.Margin(5, 0),
            font: "bold 14pt sans-serif", // Увеличенный шрифт
            stroke: "#fff", // Белый текст
            text: "Conditional Block",
          }
        ),
        new go.Panel("Horizontal", { column: 0, row: 0 }).add(
          createPort("IN", go.Spot.Left, true, "red")
        ),
        $(go.TextBlock,
          {
            editable: true,
            isMultiline: false,
            font: "bold 12pt sans-serif",
            margin: new go.Margin(10, 0),
            stroke: "#fff", // Белый текст
          },
          new go.Binding("text", "variableName").makeTwoWay()
        ),
        $(
          go.Panel,
          "Vertical",
          {
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
                  cursor: "pointer",
                },
                new go.Binding("portId", "portId")
              )
            ),
          }
        )
      )
    ),

    {
      contextMenu: $(
        go.Adornment,
        "Vertical",
        $(
          "ContextMenuButton",
          $(go.TextBlock, "Добавить условие"),
          {
            click: (e, obj) => {
              const node = obj.part;
              const model = diagram.model;

              model.startTransaction("Добавить условие");

              const conditions = node.data.conditions || [];
              const newPortId = `OUT${conditions.length}`;
              const newCondition = { text: `Condition ${conditions.length + 1}`, portId: newPortId };

              model.setDataProperty(node.data, "conditions", [...conditions, newCondition]);

              model.commitTransaction("Добавить условие");
            },
          }
        ),
        $(
          "ContextMenuButton",
          $(go.TextBlock, "Убрать условие"),
          {
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
          }
        )
      ),
    }
  );
};