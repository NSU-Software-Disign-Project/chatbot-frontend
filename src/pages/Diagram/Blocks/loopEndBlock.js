import * as go from "gojs";
import createPort from "./createPort";

const $ = go.GraphObject.make;

const loopEndBlock = $(
  go.Node,
  "Auto",
  // Фон и обводка
  $(go.Shape, "RoundedRectangle", {
    fill: "rgba(255, 69, 0, 0.25)", // Темно-оранжевый фон с прозрачностью
    stroke: "#ff4500", // Красно-оранжевая обводка
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
        text: "Loop End",
        font: "bold 14pt sans-serif",
        margin: new go.Margin(8, 16),
        stroke: "#fff",
      }),
      // Входной порт
      new go.Panel("Horizontal", { column: 0, row: 1 }).add(
        createPort("IN", go.Spot.Left, true, "#ff4500")
      ),
      // Выходной порт (для выхода из цикла)
      new go.Panel("Horizontal", { column: 2, row: 1 }).add(
        createPort("OUT", go.Spot.Right, false, "#ff4500")
      ),
    )
);

export default loopEndBlock; 