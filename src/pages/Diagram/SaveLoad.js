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
      return ["", null]; // По умолчанию, если условие пустое
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
      return ["", null]; // Некорректное условие, всегда false
    }
  
    const value = parts[1].trim();
  
    // Определяем тип значения
    let cleanValue = value;
    if (typeof cleanValue === 'string' && /^".*"$/.test(cleanValue)) {
      cleanValue = cleanValue.slice(1, -1);
    }
    if (cleanValue === "true" || cleanValue === "false") {
      conditionValue = cleanValue === "true";
    } else if (!isNaN(cleanValue)) {
      conditionValue = parseFloat(cleanValue);
    } else {
      conditionValue = cleanValue;
    }
  
    return [operator, conditionValue];
  }

  function transformToServerFormat(data) {
    const nodeDataArray = data.nodeDataArray.map((node) => {
      if (node.category === "conditionalBlock") {
        // Преобразуем conditions в conditions
        const conditions 
        = !node.conditions || node.conditions.length < 1 
        ? [] 
        : node.conditions.map((cond, index) => {
          const { text, portId } = cond;
          let [operator, conditionValue] = validateCondition(text);
          return {
            conditionId: index,
            variableName: node.variableName,
            condition: operator,
            conditionValue,
            portId,
          };
        });
  
        return {
          id: node.key,
          type: node.category,
          variableName: node.variableName,
          conditions,
        };
      } else if (node.category === "optionsBlock") {
        // Преобразуем options в choises
        const choises = !node.options || node.options.length < 1 
        ? []
        : node.options.map((option, index) => ({
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
        variableName: node.variableName || undefined,
        url: node.url || undefined,
      };
    }) || [];
  
    const linkDataArray = data.linkDataArray ? data.linkDataArray.map((link) => ({
      from: link.from,
      to: link.to,
      fromPort: link.fromPort || undefined,
      toPort: link.toPort || undefined,
    })) : [];
  
    return { nodeDataArray, linkDataArray };
  }

function transformToGoJSFormat(raw) {
    var data = raw.data;
    console.log("Node data array:", data.nodeDataArray); // Debugging statement
    const nodeDataArray = data.nodeDataArray ? data.nodeDataArray.map((node) => ({
        key: node.id, // GoJS использует key, а бэкенд — id
        category: node.type, // GoJS использует category, а бэкенд — type
        message: node.text, // GoJS использует message, а бэкенд — text
        variableName: node.variableName, // GoJS использует variableName 
        url: node.url, // GoJS использует url
        // value: node.variableName, // GoJS использует variableValue
        conditions: node.conditions ? node.conditions.map((condition) => ({
            portId: condition.portId,
            text: !condition.conditionValue
                  ? "" 
                  : `${condition.condition} ${condition.conditionValue}`
        })) : [],
        options: node.choises ? node.choises.map((choise) => ({
            portId: choise.portId,
            text: choise.text
        })) : [],
    })) : [];

    console.log("Link data array:", data.linkDataArray); // Debugging statement
    const linkDataArray = data.linkDataArray ? data.linkDataArray.map((link) => ({
        from: link.from,
        to: link.to,
        fromPort: link.fromPort || undefined,
        toPort: link.toPort || undefined,
    })) : [];

    return {
        class: "GraphLinksModel",
        linkFromPortIdProperty: "fromPort",
        linkToPortIdProperty: "toPort",
        nodeDataArray,
        linkDataArray
    };
}

if (!process.env.REACT_APP_BACKEND_URL) {
    console.error("REACT_APP_BACKEND_URL is not defined");
}

const backendAddr = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

async function saveDiagramServer(diagramRefObject, projectId, toastCb) {
    if (!projectId) {
        console.error("Project id is undefined");
        if (toastCb) toastCb.error("Project id is required to save the diagram.");
        return;
    }

    const diagram = diagramRefObject.current;
    if (!diagram) {
      if (toastCb) toastCb.error("Диаграмма не инициализирована.");
      return;
    }
  
    const json = diagram.model.toJson();
    const transformedData = transformToServerFormat(JSON.parse(json));

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${backendAddr}/projects/${projectId}/config`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(transformedData),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to save diagram to server");
        }
        // Успех — уведомление вызывается снаружи
    } catch (error) {
        console.error(error);
        if (toastCb) toastCb.error("Failed to save diagram");
        throw error;
    }
}

function loadDiagramServer(diagramRefObject, projectId, toastCb) {
    if (!projectId) {
        console.error("Project id is undefined");
        if (toastCb) toastCb.error("Project id is required to load the diagram.");
        return;
    }
    const token = localStorage.getItem('token');
    return fetch(`${backendAddr}/projects/${projectId}/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            const diagram = diagramRefObject.current;
            if (!diagram) {
                if (toastCb) toastCb.error("Диаграмма не инициализирована.");
                return;
            }
            // Преобразуем данные из формата бэкенда в формат GoJS
            const transformedData = transformToGoJSFormat({data});
            diagram.model = go.Model.fromJson(transformedData);
        })
        .catch((error) => {
            console.error("Ошибка при загрузке диаграммы:", error);
            if (toastCb) toastCb.error("Ошибка при загрузке диаграммы.");
            throw error;
        });
}

function deleteDiagramServer(projectId) {
    const token = localStorage.getItem('token');
    fetch(`${backendAddr}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then((response) => {
        if (response.ok) {
            alert("Диаграмма успешно удалена с сервера!");
        } else {
            alert("Ошибка при удалении диаграммы.");
        }
    })
    .catch((error) => {
        console.error("Ошибка при удалении диаграммы:", error);
        alert("Ошибка при удалении диаграммы.");
    });
}

function getAllDiagramsServer() {
    fetch(`${backendAddr}/api/projects`)
        .then((response) => response.json())
        .then((data) => {
            console.log("Все диаграммы:", data);
            // Здесь можно обновить состояние или выполнить другие действия с данными
        })
        .catch((error) => {
            console.error("Ошибка при получении всех диаграмм:", error);
            alert("Ошибка при получении всех диаграмм.");
        });
}

export { 
    saveDiagramServer, 
    loadDiagramServer, 
    deleteDiagramServer,
    getAllDiagramsServer,
    transformToServerFormat, 
    transformToGoJSFormat, 
    validateCondition,
    saveDiagramLocally,
    loadDiagramLocally
 };
