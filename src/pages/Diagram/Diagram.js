import React, {useEffect, useRef, useState} from 'react';
import * as go from 'gojs';
import saveBlock from "./Blocks/saveBlock";
import messageBlock from "./Blocks/messageBlock";
import {createConditionalBlock} from "./Blocks/conditionalBlock";
import {createOptionsBlock} from "./Blocks/optionsBlock";
import createPort from "./Blocks/createPort";
import {createDiagram} from "./Blocks/diagram";
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
          message:"Text message"
        },
        {
          key: 2,
          category: "conditionalBlock",
          value: "variableName",
          outputsConds:[{"":"","portId":"OUT"}]
        },
        {
          key: 3,
          category: "optionsBlock",
        },
        {
          key: 4,
          category: "saveBlock",
          name: "name",
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
        outputsConds:[{"":"","portId":"OUT"}]
      },
      {
        key: 3,
        category: "optionsBlock",
      },
      {
        key: 4,
        category: "saveBlock",
        name: "name",
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
    backgroundColor: 'rgb(30,30,30)',
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

  const handleStartBot = () => {
    saveDiagramServer(diagramRefObject, projectName)
      .then(() => {
        setIsChatOpen(true);
      })
      .catch(error => {
        console.error('Error saving diagram:', error);
      });
  };

  return (
    <>
      {/* Кнопки управления */}
      <button
        onClick={() => saveDiagramLocally(diagramRefObject)}
        style={buttonStyle}
      >
        Сохранить диаграмму локально
      </button>

      <button
        onClick={() => loadDiagramLocally(diagramRefObject)}
        style={buttonStyle}
      >
        Загрузить диаграмму из локального файла
      </button>

      <button
        onClick={() => saveDiagramServer(diagramRefObject, projectName)}
        style={buttonStyle}
      >
        Сохранить диаграмму на сервер
      </button>

      <button
        onClick={() => loadDiagramServer(diagramRefObject, projectName)}
        style={buttonStyle}
      >
        Загрузить диаграмму с сервера
      </button>

      {!isChatOpen ? (
      <button
        onClick={() =>{ saveDiagramServer(diagramRefObject, projectName); 
                        setIsChatOpen(!isChatOpen) }}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          backgroundColor: "rgb(30,30,30)",
          color: "#fff",
          border: "none",
          padding: "10px",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold",
          zIndex: 100,
        }}
      >
        {isChatOpen ? "" : "Запустить бота"}
      </button>)
        :
        (<div></div>)

      }

      {/* Контейнер для диаграммы */}
      <div style={{ display: "flex", height: "100vh", gap: "0px" }}>
        <div
          ref={paletteRef}
          style={{
            background: "rgb(10,10,10)",
            width: "150px",
            height: "100vh",
            borderRight: "1px dashed white",
            borderRadius: 10,
            overflowY: "auto",
          }}
        ></div>
        <div
          ref={diagramRef}
          style={{
            background: "rgb(10,10,10)",
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        ></div>
      </div>


      {/* Чат — независимый слой HTML */}
      {isChatOpen && (
        <div
          id="chat-container"
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: "300px",
            background: "none",
            color: "#fff",
            boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.5)",
            zIndex: 101,
          }}
        >
          <ChatPreview onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </>
  );


};

export default Diagram;
