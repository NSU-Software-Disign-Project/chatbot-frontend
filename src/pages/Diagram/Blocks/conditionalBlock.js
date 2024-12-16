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
          fill: "rgba(255,34,0,0.25)",
          stroke: "crimson",
          strokeWidth: 2,
        }
      ),
      $(
        go.Panel,
        "Vertical",
        { alignment: go.Spot.TopLeft, margin: 5 },
        $(
          go.TextBlock,
          {
            margin: new go.Margin(5, 0),
            font: "bold 8pt sans-serif",
            stroke: "rgba(255, 187, 187, 1)",
            text: "Conditional Block",
          }
        ),
        new go.Panel("Table")
          .addColumnDefinition(0, { alignment: go.Spot.Left })
          .addColumnDefinition(1, { alignment: go.Spot.Center })
          .addColumnDefinition(2, { alignment: go.Spot.Right })
          .add(
          new go.Panel("Horizontal", {  column: 0, row: 0 }).add(
            createPort("IN", go.Spot.Left, true, "red")
          ),
            $(go.TextBlock,
              {column: 1, row: 0, editable: true, isMultiline: false, alignment: go.Spot.Center,
                font: "bold 10pt sans-serif", margin: new go.Margin(0, 0, 4, 4), stroke:"rgba(204, 255, 209, 0)", text: "Conditional", },
            ),
          // new go.Panel("Horizontal", { column: 2, row: 0 }).add(
          //   createPort("OUT", go.Spot.Right, false, "red"),
          // ),
        ),

        $(
          go.TextBlock,
          {
            editable: true,
            isMultiline: false,
            font: "bold 10pt sans-serif",
            margin: new go.Margin(0, 0),
            stroke: "rgba(255, 187, 187, 1)",
          },
          new go.Binding("text", "value").makeTwoWay()
        ),
        $(
          go.Panel,
          "Vertical",
          {
            alignment: go.Spot.Center,
            name: "CONDITIONS_PANEL",
            defaultAlignment: go.Spot.Left,
            stretch: go.GraphObject.Horizontal,
          },
          new go.Binding("itemArray", "outputsConds").makeTwoWay(),
          {
            itemTemplate: $(
              go.Panel,
              "Horizontal",
              { alignment: go.Spot.Right, margin: new go.Margin(2, 0) },
              $(
                go.TextBlock,
                {
                  font: "bold 8pt sans-serif",
                  stroke: "rgba(255, 187, 187, 1)",
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
              const node = obj.part; // Текущий узел
              const model = diagram.model;

              model.startTransaction("Добавить условие");

              const outputsConds = node.data.outputsConds || [];
              const newPortId = `OUT${outputsConds.length}`;
              const newCondition = { text: `Condition ${outputsConds.length + 1}`, portId: newPortId };

              model.setDataProperty(node.data, "outputsConds", [...outputsConds, newCondition]);

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

              const outputsConds = node.data.outputsConds || [];
              if (outputsConds.length > 1) {
                outputsConds.pop();
                model.setDataProperty(node.data, "outputsConds", [...outputsConds]);
              }

              model.commitTransaction("Убрать условие");
            },
          }
        )
      ),
    }
  );
};
