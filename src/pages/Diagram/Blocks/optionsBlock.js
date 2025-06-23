import * as go from "gojs";
import createPort from "./createPort";

const $ = go.GraphObject.make;

export const createOptionsBlock = (diagram) => {
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
          fill: "rgba(254, 242, 67, 0.25)", // Жёлтый фон с прозрачностью
          stroke: "#ffcc00", // Ярко-желтая обводка
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
            margin: new go.Margin(8, 0),
            font: "bold 14pt sans-serif",
            stroke: "#fff", // Белый текст
            text: "Options Block",
          }
        ),
        $(
          go.Panel,
          "Table"
        )
          .addColumnDefinition(0, { alignment: go.Spot.Left })
          .addColumnDefinition(1, { alignment: go.Spot.Center })
          .addColumnDefinition(2, { alignment: go.Spot.Right })
          .add(
            new go.Panel("Horizontal", { column: 0, row: 0 }).add(
              createPort("IN", go.Spot.Left, true, "#ffcc00")
            ),
            $(go.TextBlock, {
              column: 1,
              row: 0,
              editable: false,
              isMultiline: false,
              alignment: go.Spot.Center,
              font: "bold 10pt sans-serif",
              margin: new go.Margin(4, 16),
              stroke: "#fff", // Белый текст
            })
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
              $(
                go.Shape,
                "Circle",
                {
                  width: 8,
                  height: 8,
                  fill: "#ffcc00", // Цвет порта
                  stroke: null,
                  fromSpot: go.Spot.Right,
                  fromLinkable: true,
                  cursor: "pointer",
                  fromMaxLinks: 1, // Только одна исходящая связь
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
          $(go.TextBlock, "Добавить опцию", { stroke: "#333" }),
          {
            click: (e, obj) => {
              const node = obj.part;
              const model = diagram.model;

              model.startTransaction("Добавить опцию");
              const options = node.data.options || [];
              const newPortId = `OUT${options.length}`;
              const newOption = { text: `Option ${options.length + 1}`, portId: newPortId };
              model.setDataProperty(node.data, "options", [...options, newOption]);
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
        )
      ),
    }
  );
};