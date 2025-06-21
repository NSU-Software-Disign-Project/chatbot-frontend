import React, {useEffect, useRef, useState} from 'react';
import * as go from 'gojs';
import saveBlock from "./Blocks/saveBlock";
import messageBlock from "./Blocks/messageBlock";
import apiBlock from "./Blocks/apiBlock";
import {createConditionalBlock} from "./Blocks/conditionalBlock";
import {createOptionsBlock} from "./Blocks/optionsBlock";
import createPort from "./Blocks/createPort";
import {createDiagram} from "./Blocks/diagram";
import loopStartBlock from "./Blocks/loopStartBlock";
import loopEndBlock from "./Blocks/loopEndBlock";
import {
  saveDiagramServer,
  loadDiagramServer,
  saveDiagramLocally,
  loadDiagramLocally
} from "./SaveLoad";
import ChatPreview from "../Messenger/ChatPreview";

const Diagram = () => {
  const diagramRef = useRef(null);
  const paletteRef = useRef(null);
  const diagramRefObject = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const $ = go.GraphObject.make;
    let diagram;

    if (diagramRef.current) {
      diagram = createDiagram(diagramRef.current);
    }

    diagram.nodeTemplateMap.add("saveBlock", saveBlock);
    diagram.nodeTemplateMap.add("apiBlock", apiBlock);
    diagram.nodeTemplateMap.add("messageBlock", messageBlock);
    diagram.nodeTemplateMap.add("conditionalBlock", createConditionalBlock(diagram));
    diagram.nodeTemplateMap.add("optionsBlock", createOptionsBlock(diagram));
    diagram.nodeTemplateMap.add("loopStartBlock", loopStartBlock);
    diagram.nodeTemplateMap.add("loopEndBlock", loopEndBlock);
    diagram.nodeTemplate = $(
      go.Node,
      "Auto",
      // Фон и обводка
      $(go.Shape, "RoundedRectangle", {
        fill: "rgba(93, 0, 255, 0.25)", // Темно-фиолетовый с прозрачностью
        stroke: "#7d3cff", // Ярко-фиолетовая обводка
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
            text: "Start Block",
            font: "bold 14pt sans-serif", // Увеличенный шрифт
            margin: new go.Margin(8, 16),
            stroke: "#fff", // Белый текст
          }),
          // Выходной порт
          new go.Panel("Horizontal", { column: 2, row: 0 }).add(
            createPort("OUT", go.Spot.Right, false, "#7d3cff")
          )
        )
    );

    diagram.div.style.pointerEvents = "auto";


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
          message:"Добро пожаловать! Я бот с поддержкой циклов."
        },
        {
          key: 2,
          category: "saveBlock",
          variableName: "userName",
        },
        {
          key: 3,
          category: "messageBlock",
          message:"Привет, ${userName}! Сейчас начнется цикл."
        },
        {
          key: 4,
          category: "loopStartBlock",
          loopVariable: "counter",
          loopOperator: "<",
          loopValue: "3",
          maxIterations: "5",
        },
        {
          key: 5,
          category: "messageBlock",
          message:"Итерация ${counter} из цикла"
        },
        {
          key: 6,
          category: "saveBlock",
          variableName: "userInput",
        },
        {
          key: 7,
          category: "messageBlock",
          message:"Вы ввели: ${userInput}"
        },
        {
          key: 8,
          category: "loopEndBlock",
        },
        {
          key: 9,
          category: "messageBlock",
          message:"Цикл завершен! До свидания, ${userName}!"
        },
      ],
      linkDataArray: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 6 },
        { from: 6, to: 7 },
        { from: 7, to: 8 },
        { from: 8, to: 4 }, // Обратная связь к началу цикла
        { from: 8, to: 9 }, // Выход из цикла
      ],
    });

    const palette = $(go.Palette, paletteRef.current, {
      layout: $(go.GridLayout, {
        wrappingColumn: 1,
        spacing: new go.Size(0, 20),
      }),
      nodeTemplateMap: diagram.nodeTemplateMap,
      contentAlignment: go.Spot.Center,
      padding: new go.Margin(0, 0, 20, 0),
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
        variableName: "variable name",
        conditions:[{"":"","portId":"OUT"}]
      },
      {
        key: 3,
        category: "optionsBlock",
      },
      {
        key: 4,
        category: "saveBlock",
        variableName: "variable name",
      },
      {
        key: 5,
        category: "apiBlock",
        variableName: "variable",
        url: "link",
      },
      {
        key: 6,
        category: "loopStartBlock",
        loopVariable: "counter",
        loopOperator: "<",
        loopValue: "5",
        maxIterations: "10",
      },
      {
        key: 7,
        category: "loopEndBlock",
      },
    ]);
    diagramRefObject.current = diagram;
    return () => {
      diagram.div = null;
      palette.div = null;
    };
  }, []);

  const buttonStyle = {
    marginRight: '10px',
    backgroundColor: '#7d3cff',
    color: '#fff',
    border: 'none',
    padding: '10px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    transition: 'background-color 0.3s ease',
  };

  const projectName = "unprocessed";

  return (
    <>
      <div style={{backgroundColor: '#1e1e1e'}}>
        <button style={
          {...buttonStyle}
        } onClick={() => saveDiagramLocally(diagramRefObject)}>
          Сохранить локально
        </button>
        <button style={buttonStyle} onClick={() => loadDiagramLocally(diagramRefObject)}>
          Загрузить локально
        </button>

        <button style={buttonStyle} onClick={() => saveDiagramServer(diagramRefObject, projectName)}>
          Сохранить на сервер
        </button>
        <button style={buttonStyle} onClick={() => loadDiagramServer(diagramRefObject, projectName)}>
          Загрузить с сервера
        </button>

        <button style={buttonStyle} onClick={async () => {
          await saveDiagramServer(diagramRefObject, projectName);
          setIsChatOpen(true);
        }}
        > Запустить бота
        </button>
      </div>

      <div style={{display: "flex", height: "100vh", gap: "0px"}}>
        <div
          ref={paletteRef}
          style={{
            width: '240px',
            background: '#111',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            height: '100%'
          }}
        >

        </div>
        <div
          ref={diagramRef}
          style={{
            background: "#1e1e1e",
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        ></div>
      </div>

      {
        isChatOpen && (
          <div
            id="chat-container"
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              bottom: 0,
              width: "300px",
              background: "#1e1e1e",
              color: "#fff",
              boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.5)",
              zIndex: 101,
            }}
          >
            <ChatPreview onClose={() => setIsChatOpen(false)}/>
          </div>
        )
      }
    </>);
};

export default Diagram;