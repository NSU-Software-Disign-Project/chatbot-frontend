import * as go from "gojs";
import diagram from "../Diagram";
import createPort from "./createPort";

const $ = go.GraphObject.make;
const optionsBlock = $(
  go.Node,
  "Auto",
  $(go.Shape, "RoundedRectangle", {stroke: "#FDDA0D", strokeWidth: 2, fill:"rgba(254,242,67,0.25)" }).bind("fill", "color"),
  $(go.Panel, "Table")
    .addColumnDefinition(0, { alignment: go.Spot.Left })
    .addColumnDefinition(1, { alignment: go.Spot.Center })
    .addColumnDefinition(2, { alignment: go.Spot.Right })
    .add(
      new go.TextBlock( // Заголовок узла
        { column: 0, row: 0, columnSpan: 4, alignment: go.Spot.Center,
          text: "Optional Block",
          font: "bold 8pt sans-serif", margin: new go.Margin(4, 2), stroke: "rgba(255, 250, 175, 1)" }),
      new go.Panel("Horizontal", { column: 0, row: 1 }).add(
        createPort("IN", go.Spot.Left, true, "rgba(254, 242, 67, 1)")
      ),
      $(go.Panel, "Vertical", { row: 2, column: 1, columnSpan: 4, alignment: go.Spot.Center },
        new go.Binding("itemArray", "additionalTexts").makeTwoWay(),
        {
          itemTemplate: $(
            go.Panel,
            "Horizontal",
            $(
              go.TextBlock,
              {
                margin: new go.Margin(4, 2),
                font: "bold 10pt sans-serif",
                editable: true,
                isMultiline: false,
                stroke: "rgba(255, 250, 175, 1)",
              },
              new go.Binding("text", "text").makeTwoWay()
            ),
            $(
              go.Shape,
              "Circle",
              {
                width: 8,
                height: 8,
                fill: "#FDDA0D",
                stroke: null,
                fromSpot: go.Spot.Right,
                fromLinkable: true,
                cursor: "pointer",
                portId:"",
                margin: new go.Margin(2, 4, 0, 4),
              },
              new go.Binding("portId", "portId")
            )
          )
        }
      )
    ),
  {
    contextMenu: $(
      "ContextMenu",
      $(
        "ContextMenuButton",
        $(go.TextBlock, "Добавить текстовую плашку"),
        {
          click: (e, obj) => {
            const node = obj.part; // Текущий узел
            const model = diagram.model;

            model.startTransaction("Добавить текстовую плашку");

            const additionalTexts = node.data.additionalTexts || [];

            const newPortId = `OUT${additionalTexts.length}`;
            additionalTexts.push({ text: "New Option", portId: newPortId });

            model.setDataProperty(node.data, "additionalTexts", additionalTexts);
            model.updateTargetBindings(node.data);

            model.commitTransaction("Добавить текстовую плашку");
          },
        }
      ),
      $(
        "ContextMenuButton",
        $(go.TextBlock, "Убрать опцию"),
        {
          click: (e, obj) => {
            const node = obj.part; // Текущий узел
            const model = diagram.model;

            model.startTransaction("Убрать опцию");

            const additionalTexts = node.data.additionalTexts || [];

            if (additionalTexts.length > 0) {
              additionalTexts.pop();
            }

            model.setDataProperty(node.data, "additionalTexts", [...additionalTexts]);

            model.commitTransaction("Убрать опцию");
          },
        }
      )
    ),
  }
);
export default optionsBlock;