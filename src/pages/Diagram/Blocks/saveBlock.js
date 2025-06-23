import * as go from "gojs";
import createPort from "./createPort";

const $ = go.GraphObject.make;

const saveBlock = $(
  go.Node,
  "Auto",
  new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
  // Фон и обводка
  $(go.Shape, "RoundedRectangle", {
    fill: "rgba(38, 166, 91, 0.25)", // Темно-зелёный с прозрачностью
    stroke: "#2ecc71", // Ярко-зелёная обводка
    strokeWidth: 2,
  }),
  // Панель содержимого
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
        text: "Save Block",
        font: "bold 14pt sans-serif", // Увеличенный шрифт
        margin: new go.Margin(8, 16), // Больше отступов
        stroke: "#fff", // Белый текст
      }),
      // Поле для переменной
      $(go.TextBlock, {
          column: 1,
          row: 1,
          editable: true,
          isMultiline: false,
          alignment: go.Spot.Center,
          font: "bold 12pt sans-serif", // Увеличенный шрифт
          margin: new go.Margin(4, 16),
          stroke: "#fff", // Белый текст
        },
        new go.Binding("text", "variableName").makeTwoWay()
      ),
      // Входной порт
      new go.Panel("Horizontal", { column: 0, row: 1 }).add(
        createPort("IN", go.Spot.Left, true, "#2ecc71") // Цвет порта
      ),
      // Выходной порт
      new go.Panel("Horizontal", { column: 2, row: 1 }).add(
        createPort("OUT", go.Spot.Right, false, "#2ecc71") // Цвет порта
      )
    )
);

export default saveBlock;