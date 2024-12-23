import * as go from 'gojs';

function saveDiagramLocally(diagramRefObject) {
  const diagram = diagramRefObject.current;
  if (!diagram) {
    alert("Диаграмма не инициализирована.");
    return;
  }

  const model = diagram.model.toJson();
  const parsedModel = JSON.parse(model);

  parsedModel.linkDataArray = (parsedModel.linkDataArray || []).map(link => {
    const { points, ...rest } = link; // Убираем points
    return rest;
  });

  // Преобразуем обратно в JSON строку
  const json = JSON.stringify(parsedModel, null, 2); // Для читаемого формата добавлен отступ

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "diagram.json";
  a.click();

  URL.revokeObjectURL(url);
}

function loadDiagramLocally(diagramRefObject) {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json";

  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target.result;
      try {
        const parsedData = JSON.parse(json);
        const diagram = diagramRefObject.current;

        if (parsedData && parsedData.nodeDataArray && parsedData.linkDataArray) {
          diagram.model = go.Model.fromJson(parsedData);
        } else {
          alert("Некорректный формат данных файла.");
        }
      } catch (error) {
        alert("Ошибка при чтении файла: " + error.message);
      }
    };

    reader.readAsText(file);
  };

  fileInput.click();
}

function validateCondition(conditionText) {
  if (!conditionText) {
    return ["==", false]; // По умолчанию, если условие пустое
  }

  const operators = [">=", "<=", ">", "<", "==", "!="];
  let operator = "=="; // По умолчанию
  let conditionValue;

  for (const op of operators) {
    if (conditionText.includes(op)) {
      operator = op;
      break;
    }
  }

  const parts = conditionText.split(operator);
  if (parts.length !== 2) {
    return ["==", false]; // Если условие некорректно, возвращаем false
  }

  const value = parts[1].trim();

  if (value === "true" || value === "false") {
    conditionValue = value === "true";
  } else if (!isNaN(value)) {
    conditionValue = parseFloat(value);
  } else {
    conditionValue = value;
  }

  return [operator, conditionValue];
}

function transformToServerFormat(data) {
  const nodeDataArray = (data.nodeDataArray || []).map((node) => {
    if (node.category === "conditionalBlock") {
      const conditions = (node.outputsConds || []).map((cond, index) => {
        const { text, portId } = cond;
        const [operator, conditionValue] = validateCondition(text);
        return {
          conditionId: index,
          variableName: node.value,
          condition: operator,
          conditionValue,
          portId,
        };
      });

      return {
        id: node.key,
        type: node.category,
        variableName: node.value,
        conditions,
      };
    } else if (node.category === "optionsBlock") {
      const choises = (node.options || []).map((option, index) => ({
        choiseId: index,
        text: option.text,
        portId: option.portId,
      }));

      return {
        id: node.key,
        type: node.category,
        choises,
      };
    }

    return {
      id: node.key,
      type: node.category,
      text: node.message || undefined,
      variableName: node.name || undefined,
      variableValue: node.value || undefined,
    };
  });

  const linkDataArray = (data.linkDataArray || []).map((link) => ({
    from: link.from,
    to: link.to,
    fromPort: link.fromPort || undefined,
    toPort: link.toPort || undefined,
  }));

  return { nodeDataArray, linkDataArray };
}

function transformToGoJSFormat(data) {
  const nodeDataArray = (data.nodeDataArray || []).map((node) => ({
    key: node.id,
    category: node.type,
    message: node.text,
    name: node.variableName,
    value: node.variableValue,
    inputs: (node.conditions || []).map((condition) => ({ portId: condition.portId })),
    outputs: (node.choises || []).map((choise) => ({ portId: choise.portId })),
    additionalTexts: (node.choises || []).map((choise) => ({ text: choise.text })),
  }));

  const linkDataArray = (data.linkDataArray || []).map((link) => ({
    from: link.from,
    to: link.to,
    fromPort: link.fromPort || undefined,
    toPort: link.toPort || undefined,
  }));

  return { nodeDataArray, linkDataArray };
}

function saveDiagramServer(diagramRefObject) {
  const diagram = diagramRefObject.current;
  if (!diagram) {
    alert("Диаграмма не инициализирована.");
    return;
  }

  const json = diagram.model.toJson();
  const transformedData = transformToServerFormat(JSON.parse(json));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    alert("Время ожидания ответа сервера истекло.");
  }, 2000);

  fetch('/api/saveDiagram', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transformedData),
    signal: controller.signal,
  })
    .then((response) => response.json())
    .then((data) => {
      clearTimeout(timeoutId);
      alert("Диаграмма успешно сохранена на сервере!");
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      console.error("Ошибка при сохранении диаграммы:", error);
      alert("Ошибка при сохранении диаграммы.");
    });
}

function loadDiagramServer(diagramRefObject) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    alert("Время ожидания ответа сервера истекло.");
  }, 2000);

  fetch('/api/loadDiagram', { signal: controller.signal })
    .then((response) => response.json())
    .then((data) => {
      clearTimeout(timeoutId);

      const diagram = diagramRefObject.current;
      if (!diagram) {
        alert("Диаграмма не инициализирована.");
        return;
      }

      const transformedData = transformToGoJSFormat(data);
      diagram.model = go.Model.fromJson(transformedData);
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      console.error("Ошибка при загрузке диаграммы:", error);
      alert("Ошибка при загрузке диаграммы.");
    });
}

export {
  saveDiagramServer,
  loadDiagramServer,
  transformToServerFormat,
  transformToGoJSFormat,
  validateCondition,
  saveDiagramLocally,
  loadDiagramLocally,
};
