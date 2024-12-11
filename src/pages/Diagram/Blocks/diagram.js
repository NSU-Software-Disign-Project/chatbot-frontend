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

  // Устанавливаем базовую модель для тестирования
  diagram.model = new go.GraphLinksModel(
    [{ key: 1, text: "Node 1" }, { key: 2, text: "Node 2" }],
    [{ from: 1, to: 2 }]
  );

  return diagram;
};
