import React, {useEffect, useRef} from 'react';
import * as go from 'gojs';
import saveBlock from "./Blocks/saveBlock";
import messageBlock from "./Blocks/messageBlock";
import {createConditionalBlock} from "./Blocks/conditionalBlock";
import {createOptionsBlock} from "./Blocks/optionsBlock";
import createPort from "./Blocks/createPort";
import {createDiagram} from "./Blocks/diagram";

const Diagram = () => {
  const diagramRef = useRef(null);
  const paletteRef = useRef(null);
  const diagramRefObject = useRef(null);

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

  useEffect(() => {
    const $ = go.GraphObject.make;
    let diagram;

    if (diagramRef.current) {
      diagram = createDiagram(diagramRef.current);
    }

    diagram.nodeTemplateMap.add("saveBlock", saveBlock);
    diagram.nodeTemplateMap.add("messageBlock", messageBlock);
    diagram.nodeTemplateMap.add("conditionalBlock", createConditionalBlock(diagram));
    diagram.nodeTemplateMap.add("optionsBlock", createOptionsBlock(diagram));
    diagram.nodeTemplate = $(
      go.Node,
      "Auto",
      $(go.Shape, "RoundedRectangle", {stroke: "purple", strokeWidth: 2, fill:"rgba(173,0,255,0.25)" }),
      new go.TextBlock(
        { text:"Start Block",
          column: 0, row: 0, columnSpan: 4, alignment: go.Spot.Center,
          font: "bold 8pt sans-serif", margin: new go.Margin(4, 10, 0, 0), stroke:"#F99EFF"}
      ),
      $(
        go.Panel,
        "Vertical",
        {
          alignment: go.Spot.Right,
          alignmentFocus: go.Spot.Right,
        },
      ).add(createPort("OUT", go.Spot.Right, false, "purple")),
    );

    diagram.linkTemplate = $(
      go.Link,
      {
        corner: 5,
        curve: go.Link.JumpOver,
        toShortLength: 4,
      },
      new go.Binding("points").makeTwoWay(),
      $(go.Shape,
        { isPanelMain: true, stroke: "white", strokeWidth: 1 }
      ),
      $(go.Shape,
        { toArrow: "roundedTriangle", stroke: "white", fill: "white", scale: 0.8 }
      ),
    );

    diagram.layout = new go.LayeredDigraphLayout({ columnSpacing: 10 });
    diagram.model = new go.GraphLinksModel({
      linkFromPortIdProperty: "fromPort",
      linkToPortIdProperty: "toPort",
      nodeDataArray: [
        {
          key: 0,
          category: "startBlock",
        },
        {
          key: 1,
          category: "messageBlock",
          message:"Text message"
        },
        {
          key: 2,
          category: "conditionalBlock",
          value: "valueName",
          inputs: [{ portId: "IN1" }],
          outputs: [{ portId: "OUT1" }, { portId: "OUT2" }],
        },
        {
          key: 3,
          category: "optionsBlock",
          additionalTexts: [{ text: "Default Option" }] ,
        },
        {
          key: 4,
          category: "saveBlock",
          name: "name",
          value: "value",
        },
      ],
      linkDataArray: [],
    });

    const palette = $(go.Palette, paletteRef.current, {
      layout: $(go.GridLayout, {
        wrappingColumn: 1,
        spacing: new go.Size(0, 20),
      }),
      nodeTemplateMap: diagram.nodeTemplateMap,
      contentAlignment: go.Spot.Center,
      padding: new go.Margin(20, 0, 20, 0),
      allowZoom: false,
    });

    palette.model = new go.GraphLinksModel([
      {
        key: 0,
        category: "startBlock",
      },
      {
        key: 1,
        category: "messageBlock",
        message:"Text message"
      },
      {
        key: 2,
        category: "conditionalBlock",
        value: "variableName",
        inputs: [{ portId: "IN1" }],
        outputs: [{ portId: "OUT1" }, { portId: "OUT2" }],
      },
      {
        key: 3,
        category: "optionsBlock",
        additionalTexts: [{ text: "Default Option" }] ,
      },
      {
        key: 4,
        category: "saveBlock",
        name: "name",
        value: "value",
      },
    ]);
    diagramRefObject.current = diagram;
    return () => {
      diagram.div = null;
      palette.div = null;
    };
  }, []);
  return (
    <>
      <button
        onClick={saveDiagramLocally}
        style={{
          marginRight: "10px",
          backgroundColor: 'rgb(30,30,30)',
          color: '#fff',
          border: 'none',
          padding: '10px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          transition: 'background-color 0.3s ease',
        }}
      >
        Сохранить диаграмму локально
      </button>
      <button
        onClick={loadDiagramLocally}
        style={{
          backgroundColor: 'rgb(30,30,30)',
          color: '#fff',
          border: 'none',
          padding: '10px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          transition: 'background-color 0.3s ease',
        }}
      >
        Загрузить диаграмму из локального файла
      </button>
      <button
        // onClick={saveDiagramServer}
        style={{
          marginRight: "10px",
          backgroundColor: 'rgb(30,30,30)',
          color: '#fff',
          border: 'none',
          padding: '10px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          transition: 'background-color 0.3s ease',
        }}
      >
        Сохранить диаграмму на сервер
      </button>
      <button
        // onClick={loadDiagramServer}
        style={{
          marginRight: "10px",
          backgroundColor: 'rgb(30,30,30)',
          color: '#fff',
          border: 'none',
          padding: '10px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          transition: 'background-color 0.3s ease',
        }}
      >
        Выгрузить диаграмму с сервера
      </button>
      <button
        // onClick={}
        style={{
          backgroundColor: 'rgb(30,30,30)',
          color: '#fff',
          border: 'none',
          padding: '10px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          transition: 'background-color 0.3s ease',
        }}
      >
        Запустить бота
      </button>
      <div style={{display: 'flex', gap: '0px', height: '100vh'}}>
        <div
          ref={paletteRef}
          style={{
            background: 'rgb(10,10,10)',
            width: '150px',
            height: '100vh',
            borderRight: '1px white',
            borderStyle: 'dashed',
            borderRadius: 10,
            overflowY: 'auto', // Добавляем прокрутку, если содержимое палитры превышает высоту экрана
          }}
        >
        </div>
        <div
          ref={diagramRef}
          style={{
            background: 'rgb(10,10,10)',
            flexGrow: 1,
            height: '100vh',
          }}
        >
        </div>
      </div>
    </>
  );
};

export default Diagram;
