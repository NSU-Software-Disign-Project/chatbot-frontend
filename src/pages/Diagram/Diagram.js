import React, {useEffect, useRef, useState} from 'react';
import { useParams } from 'react-router-dom';
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
  loadDiagramLocally,
  transformToGoJSFormat
} from "./SaveLoad";
import ChatPreview from "../Messenger/ChatPreview";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../../Header';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const Diagram = () => {
  const { id } = useParams();
  const diagramRef = useRef(null);
  const paletteRef = useRef(null);
  const diagramRefObject = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);
  const [nodeDataArray, setNodeDataArray] = useState([]);
  const [linkDataArray, setLinkDataArray] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [projectRole, setProjectRole] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${backendUrl}/projects/${id}/config`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка загрузки конфигурации');
        const data = await res.json();
        setProjectName(data.name || 'Без названия');
        setNameInput(data.name || 'Без названия');
        setProjectRole(data.role || null);
        const gojs = transformToGoJSFormat({ data });
        setNodeDataArray(gojs.nodeDataArray || [{ key: 0, category: "startBlock" }]);
        setLinkDataArray(gojs.linkDataArray || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [id]);

  useEffect(() => {
    try {
      const $ = go.GraphObject.make;
      let diagram;
      if (diagramRef.current) {
        diagram = createDiagram(diagramRef.current);
      }
      if (!diagram) return;
      diagram.scale = 0.9;
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
        $(go.Shape, "RoundedRectangle", {
          fill: "rgba(93, 0, 255, 0.25)",
          stroke: "#7d3cff",
          strokeWidth: 2,
        }),
        $(go.Panel, "Table")
          .addColumnDefinition(0, { alignment: go.Spot.Left })
          .addColumnDefinition(1, { alignment: go.Spot.Center })
          .addColumnDefinition(2, { alignment: go.Spot.Right })
          .add(
            new go.TextBlock({
              column: 0,
              row: 0,
              columnSpan: 3,
              alignment: go.Spot.Center,
              text: "Start Block",
              font: "bold 14pt sans-serif",
              margin: new go.Margin(8, 16),
              stroke: "#fff",
            }),
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
        $(go.Shape, { isPanelMain: true, stroke: "white", strokeWidth: 1 }),
        $(go.Shape, { toArrow: "roundedTriangle", stroke: "white", fill: "white", scale: 0.8 }),
      );
      diagram.layout = new go.LayeredDigraphLayout({ columnSpacing: 10 });
      diagram.model = new go.GraphLinksModel({
        linkFromPortIdProperty: "fromPort",
        linkToPortIdProperty: "toPort",
        nodeDataArray: nodeDataArray,
        linkDataArray: linkDataArray,
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
        { key: 0, category: "startBlock" },
        { key: 1, category: "messageBlock", message: "Text message" },
        { key: 2, category: "conditionalBlock", variableName: "variable name", conditions: [{ "": "", "portId": "OUT" }] },
        { key: 3, category: "optionsBlock" },
        { key: 4, category: "saveBlock", variableName: "variable name" },
        { key: 5, category: "apiBlock", variableName: "variable", url: "link" },
        { key: 6, category: "loopStartBlock", loopVariable: "counter", loopOperator: "<", loopValue: "5", maxIterations: "10" },
        { key: 7, category: "loopEndBlock" },
      ]);
      palette.layout.arrangementOrigin = new go.Point(0, 40);
      palette.scale = 0.85;
      diagramRefObject.current = diagram;
      return () => {
        diagram.div = null;
        palette.div = null;
      };
    } catch (e) {
      setError(e.message || 'Ошибка инициализации диаграммы');
      console.error('Ошибка инициализации диаграммы:', e);
    }
  }, [nodeDataArray, linkDataArray]);

  const buttonStyle = {
    marginRight: '8px',
    backgroundColor: '#7d3cff',
    color: '#fff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    transition: 'background-color 0.3s ease',
    minWidth: '120px',
  };

  const handleRename = async () => {
    if (!nameInput.trim() || nameInput.trim() === projectName) {
      setEditName(false);
      setNameInput(projectName);
      return;
    }
    setSavingName(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка при переименовании');
      }
      setProjectName(nameInput.trim());
      toast.success('Название проекта обновлено!');
    } catch (e) {
      toast.error(e.message || 'Ошибка при переименовании');
      setNameInput(projectName);
    } finally {
      setEditName(false);
      setSavingName(false);
    }
  };

  // Обёртки для Save/Load с уведомлениями
  const handleSaveServer = async () => {
    if (projectRole === 'viewer') {
      toast.error('Нет доступа, диаграмма не сохранена');
      return;
    }
    try {
      await saveDiagramServer(diagramRefObject, id, toast);
      toast.success('Диаграмма успешно сохранена на сервер!');
    } catch (e) {
      toast.error('Ошибка при сохранении диаграммы');
    }
  };
  const handleLoadServer = async () => {
    try {
      await loadDiagramServer(diagramRefObject, id, toast);
      toast.success('Диаграмма успешно загружена с сервера!');
    } catch (e) {
      toast.error('Ошибка при загрузке диаграммы');
    }
  };
  const handleSaveLocal = () => {
    try {
      saveDiagramLocally(diagramRefObject);
      toast.success('Диаграмма сохранена локально!');
    } catch (e) {
      toast.error('Ошибка при локальном сохранении');
    }
  };
  const handleLoadLocal = () => {
    try {
      loadDiagramLocally(diagramRefObject);
      toast.success('Диаграмма загружена локально!');
    } catch (e) {
      toast.error('Ошибка при локальной загрузке');
    }
  };

  if (loading) return <div>Загрузка диаграммы...</div>;
  if (error) return <div style={{color:'red'}}>Ошибка: {error}</div>;

  return (
    <>
      <ToastContainer
        position="bottom-center"
        autoClose={1800}
        hideProgressBar
        theme="dark"
        style={{ fontSize: 14, minWidth: 220, maxWidth: 320 }}
        toastStyle={{ borderRadius: 8, padding: '8px 16px', minHeight: 36 }}
        closeButton={false}
        limit={2}
      />
      <div style={{
        background: '#181828',
        padding: '28px 32px 18px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        borderBottom: '1px solid #333',
        minHeight: 80,
      }}>
        <div style={{ marginRight: 18, flexShrink: 0 }}>
          <Header />
        </div>
        <div style={{ flexShrink: 0, marginLeft: 80 }}>
          {editName ? (
            <form onSubmit={e => { e.preventDefault(); handleRename(); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                disabled={savingName}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setEditName(false);
                    setNameInput(projectName);
                  }
                }}
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  background: '#23234a',
                  color: '#fff',
                  border: '1px solid #7d3cff',
                  borderRadius: 6,
                  padding: '4px 12px',
                  minWidth: 180,
                  marginRight: 8,
                }}
                maxLength={40}
              />
              <button type="submit" disabled={savingName} style={{ display: 'none' }} />
            </form>
          ) : (
            <span
              style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: 0.5, cursor: 'pointer' }}
              onClick={() => setEditName(true)}
              title="Переименовать проект"
            >{projectName}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {projectRole !== 'viewer' && (
            <button style={buttonStyle} onClick={handleSaveLocal}>Сохранить локально</button>
          )}
          {projectRole !== 'viewer' && (
            <button style={buttonStyle} onClick={handleLoadLocal}>Загрузить локально</button>
          )}
          {projectRole !== 'viewer' && (
            <button
              style={buttonStyle}
              onClick={handleSaveServer}
            >Сохранить на сервер</button>
          )}
          <button style={buttonStyle} onClick={handleLoadServer}>Загрузить с сервера</button>
          <button
            style={buttonStyle}
            onClick={async () => {
              if (projectRole !== 'viewer') {
                await handleSaveServer();
              }
              setIsChatOpen(true);
            }}
          >Запустить бота</button>
        </div>
      </div>
      <div style={{
        display: "flex",
        height: "100vh",
        gap: "0px",
      }}>
        <div
          ref={paletteRef}
          style={{
            width: '240px',
            background: '#111',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            height: 'calc(100vh - 80px - 28px - 18px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="palette-no-scroll"
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
      {isChatOpen && (
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
          <ChatPreview onClose={() => setIsChatOpen(false)} projectId={id}/>
        </div>
      )}
      <style>{`
        .palette-no-scroll::-webkit-scrollbar { display: none; }
        .palette-no-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        [style*='gojs.net'] { display: none !important; }
      `}</style>
    </>
  );
};

export default Diagram;