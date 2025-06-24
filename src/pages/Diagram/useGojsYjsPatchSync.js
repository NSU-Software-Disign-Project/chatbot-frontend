import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import * as go from 'gojs';

/**
 * Патч-синхронизация GoJS <-> Yjs через Y.Map для каждого блока и связи.
 * @param {object} params
 *   - enabled: boolean — включить/выключить синхронизацию
 *   - diagramRef: React ref на GoJS Diagram
 *   - projectId: string — уникальный room для проекта
 */
export function useGojsYjsPatchSync({ enabled, diagramRef, projectId }) {
  const ydocRef = useRef(null);
  const providerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !diagramRef.current || !projectId) return;

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      process.env.REACT_APP_YJS_WS_URL || (
        window.location.hostname === 'localhost'
          ? 'ws://localhost:1234'
          : 'ws://yjs-websocket:1234'
      ),
      projectId,
      ydoc
    );
    ydocRef.current = ydoc;
    providerRef.current = provider;

    const yText = ydoc.getText('diagram');

    let suppressGojs = false;
    let suppressYjs = false;

    // Yjs -> GoJS
    const updateGojsFromYjs = () => {
      if (suppressGojs) return;
      const json = yText.toString();
      if (json && diagramRef.current) {
        suppressYjs = true;
        let newModel = null;
        try {
          newModel = go.Model.fromJson(json);
        } catch (e) {
          suppressYjs = false;
          return;
        }
        if (!newModel) {
          suppressYjs = false;
          return;
        }
        // Пересоздаём модель для корректного обновления GoJS
        const model = new go.GraphLinksModel(
          newModel.nodeDataArray,
          newModel.linkDataArray
        );
        if (newModel.linkFromPortIdProperty)
          model.linkFromPortIdProperty = newModel.linkFromPortIdProperty;
        if (newModel.linkToPortIdProperty)
          model.linkToPortIdProperty = newModel.linkToPortIdProperty;
        diagramRef.current.model = model;
        suppressYjs = false;
      }
    };
    yText.observe(updateGojsFromYjs);

    // GoJS -> Yjs
    const onModelChanged = (e) => {
      if (suppressYjs) return;
      if (e.isTransactionFinished && diagramRef.current) {
        const json = diagramRef.current.model.toJson();
        if (yText.toString() !== json) {
          suppressGojs = true;
          yText.delete(0, yText.length);
          yText.insert(0, json);
          suppressGojs = false;
        }
      }
    };
    diagramRef.current.addModelChangedListener(onModelChanged);

    // Инициализация: если Yjs пустой — записать текущее состояние диаграммы
    if (yText.length === 0 && diagramRef.current) {
      yText.insert(0, diagramRef.current.model.toJson());
    } else {
      updateGojsFromYjs();
    }

    return () => {
      yText.unobserve(updateGojsFromYjs);
      diagramRef.current.removeModelChangedListener(onModelChanged);
      provider.disconnect();
      ydoc.destroy();
    };
  }, [enabled, diagramRef, projectId]);
} 