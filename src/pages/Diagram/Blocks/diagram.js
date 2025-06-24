import * as go from "gojs";

export const createDiagram = (divRef) => {
  if (!divRef) {
    throw new Error("divRef должен быть валидным DOM-элементом.");
  }

  const $ = go.GraphObject.make;

  // Создаем и настраиваем диаграмму
  const diagram = $(go.Diagram, divRef, {
    'undoManager.isEnabled': true,
    'linkingTool.isEnabled': true,
    'relinkingTool.isEnabled': true,
    layout: $(go.LayeredDigraphLayout),
  });

  // Пример шаблона с two-way binding для location
  diagram.nodeTemplate = $(go.Node, "Auto",
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    $(go.Shape, "RoundedRectangle", { fill: "#eee" }),
    $(go.TextBlock, { margin: 8 }, new go.Binding("text", "text"))
  );
  // Устанавливаем базовую модель для тестирования
  diagram.model = new go.GraphLinksModel(
    [
      { key: 1, text: "Node 1", loc: "0 0" },
      { key: 2, text: "Node 2", loc: "150 0" }
    ],
    [{ from: 1, to: 2 }]
  );

  return diagram;
};
