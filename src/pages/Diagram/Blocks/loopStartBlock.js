import * as go from "gojs";
import createPort from "./createPort";

const $ = go.GraphObject.make;

const loopStartBlock = $(
  go.Node,
  "Auto",
  // Фон и обводка
  $(go.Shape, "RoundedRectangle", {
    fill: "rgba(255, 140, 0, 0.25)", // Оранжевый фон с прозрачностью
    stroke: "#ff8c00", // Ярко-оранжевая обводка
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
        text: "Loop Start",
        font: "bold 14pt sans-serif",
        margin: new go.Margin(8, 16),
        stroke: "#fff",
      }),
      // Поле для переменной цикла
      $(go.TextBlock, {
          column: 1,
          row: 1,
          editable: true,
          isMultiline: false,
          alignment: go.Spot.Center,
          font: "bold 12pt sans-serif",
          margin: new go.Margin(4, 16),
          stroke: "#fff",
        },
        new go.Binding("text", "loopVariable").makeTwoWay()
      ),
      // Поле для оператора
      $(go.TextBlock, {
          column: 1,
          row: 2,
          editable: true,
          isMultiline: false,
          alignment: go.Spot.Center,
          font: "bold 12pt sans-serif",
          margin: new go.Margin(4, 16),
          stroke: "#fff",
        },
        new go.Binding("text", "loopOperator").makeTwoWay()
      ),
      // Поле для значения
      $(go.TextBlock, {
          column: 1,
          row: 3,
          editable: true,
          isMultiline: false,
          alignment: go.Spot.Center,
          font: "bold 12pt sans-serif",
          margin: new go.Margin(4, 16),
          stroke: "#fff",
        },
        new go.Binding("text", "loopValue").makeTwoWay()
      ),
      // Поле для максимального количества итераций
      $(go.TextBlock, {
          column: 1,
          row: 4,
          editable: true,
          isMultiline: false,
          alignment: go.Spot.Center,
          font: "bold 12pt sans-serif",
          margin: new go.Margin(4, 16),
          stroke: "#fff",
        },
        new go.Binding("text", "maxIterations").makeTwoWay()
      ),
      // Выходной порт
      new go.Panel("Horizontal", { column: 2, row: 2 }).add(
        createPort("OUT", go.Spot.Right, false, "#ff8c00")
      ),
    )
);

export default loopStartBlock; 