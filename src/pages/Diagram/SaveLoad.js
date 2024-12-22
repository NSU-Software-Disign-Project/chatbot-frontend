import * as go from 'gojs';

function saveDiagramLocally(diagramRefObject) {
    const diagram = diagramRefObject.current;
    if (!diagram) {
      alert("Диаграмма не инициализирована.");
      return;
    }

    const model = diagram.model.toJson();
    const parsedModel = JSON.parse(model);

    parsedModel.linkDataArray = parsedModel.linkDataArray.map(link => {
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
      return ["===", false]; // По умолчанию, если условие пустое
    }
  
    const operators = [">=", "<=", ">", "<", "==", "!="];
    let operator = "==="; // По умолчанию
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
        const conditions 
        = !node.outputsConds || node.outputsConds.length < 1 
        ? [] 
        : node.outputsConds.map((cond, index) => {
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
        variableName: node.name || undefined,
        variableValue: node.value || undefined,
      };
    });
  
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
        name: node.variableName, // GoJS использует variableName
        value: node.variableValue, // GoJS использует variableValue
        outputsConds: node.conditions ? node.conditions.map((condition) => ({
            portId: condition.portId,
            text: condition.conditionValue === false 
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

const backendAddr = process.env.REACT_APP_ENV === 'production' 
    ? process.env.REACT_APP_BACKEND_CONTAINER 
    : process.env.REACT_APP_BACKEND_ADDR;

function saveDiagramServer(diagramRefObject, projectName) {
    const diagram = diagramRefObject.current;
    if (!diagram) {
      alert("Диаграмма не инициализирована.");
      return;
    }
  
    const json = diagram.model.toJson();
    const transformedData = transformToServerFormat(JSON.parse(json));
  
    // Отправляем transformedData на сервер
    fetch(`${backendAddr}/api/project/${projectName}`, {
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

function loadDiagramServer(diagramRefObject, projectName) {
    fetch(`${backendAddr}/api/project/${projectName}`)
        .then((response) => response.json())
        .then((data) => {
            console.log("Data received from server:", data); // Debugging statement
            const diagram = diagramRefObject.current;
            if (!diagram) {
                alert("Диаграмма не инициализирована.");
                return;
            }
  
        // Преобразуем данные в формат, который понимает GoJS
        const transformedData = transformToGoJSFormat(data);
        console.log("Transformed data:", transformedData); // Debugging statement
  
        diagram.model = go.Model.fromJson(transformedData);
        console.log("Diagram model after loading:", diagram.model.toJson()); // Debugging statement
        })
        .catch((error) => {
            console.error("Ошибка при загрузке диаграммы:", error);
            alert("Ошибка при загрузке диаграммы.");
        });
  }

function deleteDiagramServer(projectName) {
    fetch(`${backendAddr}/api/project/${projectName}`, {
        method: 'DELETE',
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