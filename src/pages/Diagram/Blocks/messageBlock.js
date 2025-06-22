import * as go from "gojs";
import createPort from "./createPort";
import { nodeContextMenu } from "./diagram";

const $ = go.GraphObject.make;

const messageBlock = $(
  go.Node,
  "Auto",
  { contextMenu: nodeContextMenu },
  // Фон и обводка
  $(go.Shape, "RoundedRectangle", {
    fill: "#1a237e", // Темно-синий фон
    stroke: "#3f51b5", // Ярко-синяя обводка
    strokeWidth: 2,
  }),
  // Панель для содержимого
  $(go.Panel, "Table")
    .addColumnDefinition(0, { alignment: go.Spot.Left })
    .addColumnDefinition(1, { alignment: go.Spot.Center })
    .addColumnDefinition(2, { alignment: go.Spot.Right })
    .add(
      // Название блока
      new go.TextBlock({
        column: 0,
        row: 0,
        columnSpan: 3,
        alignment: go.Spot.Center,
        text: "Message Block",
        font: "bold 14pt sans-serif", // Увеличенный шрифт
        margin: new go.Margin(8, 16), // Больше отступов
        stroke: "#fff", // Белый текст
      }),
      // Поле для редактирования сообщения
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
          stroke: "#fff",
        },
        new go.Binding("text", "message").makeTwoWay()
      ),
      // Входной порт
      new go.Panel("Horizontal", { column: 0, row: 1 }).add(
        createPort("IN", go.Spot.Left, true, "#3f51b5")
      ),
      // Выходной порт
      new go.Panel("Horizontal", { column: 2, row: 1 }).add(
        createPort("OUT", go.Spot.Right, false, "#3f51b5")
      )
    )
);

export default messageBlock;
