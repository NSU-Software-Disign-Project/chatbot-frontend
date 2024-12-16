
function saveDiagramLocally() {
    const diagram = diagramRefObject.current;
    if (!diagram) {
      alert("Диаграмма не инициализирована.");
      return;
    }

    const json = diagram.model.toJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.json";
    a.click();

    URL.revokeObjectURL(url);
  }


function loadDiagramLocally() {
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
  
    // Проверяем, есть ли оператор в условии
    for (const op of operators) {
      if (conditionText.includes(op)) {
        operator = op;
        break;
      }
    }
  
    // Разделяем условие на оператор и значение
    const parts = conditionText.split(operator);
    if (parts.length !== 2) {
      return ["==", false]; // Если условие некорректно, возвращаем false
    }
  
    const value = parts[1].trim();
  
    // Определяем тип значения
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
    const nodeDataArray = data.nodeDataArray.map((node) => {
      if (node.category === "conditionalBlock") {
        // Преобразуем outputsConds в conditions
        const conditions = node.outputsConds.map((cond, index) => {
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
        // Преобразуем options в choises
        const choises = node.options.map((option, index) => ({
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
  
    const linkDataArray = data.linkDataArray.map((link) => ({
      from: link.from,
      to: link.to,
      fromPort: link.fromPort || undefined,
      toPort: link.toPort || undefined,
    }));
  
    return { nodeDataArray, linkDataArray };
  }

function transformToGoJSFormat(data) {
    const nodeDataArray = data.nodeDataArray.map((node) => ({
        key: node.id, // GoJS использует key, а бэкенд — id
        category: node.type, // GoJS использует category, а бэкенд — type
        message: node.text, // GoJS использует message, а бэкенд — text
        name: node.variableName, // GoJS использует name, а бэкенд — variableName
        value: node.variableValue, // GoJS использует value, а бэкенд — variableValue
        inputs: node.conditions?.map((condition) => ({ portId: condition.portId })),
        outputs: node.choises?.map((choise) => ({ portId: choise.portId })),
        additionalTexts: node.choises?.map((choise) => ({ text: choise.text })),
    }));

    const linkDataArray = data.linkDataArray.map((link) => ({
        from: link.from,
        to: link.to,
        fromPort: link.fromPort || undefined,
        toPort: link.toPort || undefined,
    }));

    return { nodeDataArray, linkDataArray };
}

function saveDiagramServer() {
    const diagram = diagramRefObject.current;
    if (!diagram) {
      alert("Диаграмма не инициализирована.");
      return;
    }
  
    const json = diagram.model.toJson();
    const transformedData = transformToServerFormat(JSON.parse(json));
  
    // Отправляем transformedData на сервер
    fetch('/api/saveDiagram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    })
      .then((response) => response.json())
      .then((data) => {
        alert("Диаграмма успешно сохранена на сервере!");
      })
      .catch((error) => {
        console.error("Ошибка при сохранении диаграммы:", error);
        alert("Ошибка при сохранении диаграммы.");
      });
  }

  function loadDiagramServer() {
    fetch('/api/loadDiagram')
      .then((response) => response.json())
      .then((data) => {
        const diagram = diagramRefObject.current;
        if (!diagram) {
          alert("Диаграмма не инициализирована.");
          return;
        }
  
        // Преобразуем данные в формат, который понимает GoJS
        const transformedData = transformToGoJSFormat(data);
  
        diagram.model = go.Model.fromJson(transformedData);
      })
      .catch((error) => {
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
    loadDiagramLocally
 };