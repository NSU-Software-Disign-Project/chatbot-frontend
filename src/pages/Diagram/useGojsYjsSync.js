import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import * as go from 'gojs';

/**
 * Реализация минимального real-time sync GoJS <-> Yjs.
 * @param {object} params
 *   - enabled: boolean — включить/выключить синхронизацию
 *   - diagramRef: React ref на GoJS Diagram
 *   - projectId: string — уникальный room для проекта
 */
export function useGojsYjsSync({ enabled, diagramRef, projectId }) {
  const ydocRef = useRef(null);
  const providerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !diagramRef.current || !projectId) return;

    // 1. Создаём Yjs doc и провайдер
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      window.location.hostname === 'localhost'
        ? 'ws://localhost:1234'
        : 'ws://yjs-websocket:1234',
      projectId,
      ydoc
    );
    ydocRef.current = ydoc;
    providerRef.current = provider;

    // 2. Y.Text для хранения JSON модели
    const yText = ydoc.getText('diagram');

    let suppressGojs = false;
    let suppressYjs = false;

    // 3. Yjs -> GoJS
    const updateGojsFromYjs = () => {
      if (suppressGojs) return;
      const json = yText.toString();
      if (json && diagramRef.current) {
        suppressYjs = true;
        let newModel = null;
        try {
          newModel = go.Model.fromJson(json);
        } catch (e) {
          console.warn('JSON.parse error:', e);
          suppressYjs = false;
          return;
        }
        if (!newModel) {
          console.warn('GoJS model is null after fromJson, skipping update');
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
        console.log('[Yjs->GoJS] Обновлена диаграмма из Yjs', newModel.nodeDataArray, newModel.linkDataArray);
      }
    };
    yText.observe(updateGojsFromYjs);

    // 4. GoJS -> Yjs
    const onModelChanged = (e) => {
      if (suppressYjs) return;
      if (e.isTransactionFinished && diagramRef.current) {
        const json = diagramRef.current.model.toJson();
        if (yText.toString() !== json) {
          suppressGojs = true;
          yText.delete(0, yText.length);
          yText.insert(0, json);
          suppressGojs = false;
          console.log('[GoJS->Yjs] Отправлена диаграмма в Yjs', diagramRef.current.model.nodeDataArray, diagramRef.current.model.linkDataArray);
        }
      }
    };
    diagramRef.current.addModelChangedListener(onModelChanged);

    // 5. Инициализация: если Yjs пустой — записать текущее состояние диаграммы
    if (yText.length === 0 && diagramRef.current) {
      yText.insert(0, diagramRef.current.model.toJson());
      console.log('[Init] Yjs был пуст, записали локальную диаграмму');
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