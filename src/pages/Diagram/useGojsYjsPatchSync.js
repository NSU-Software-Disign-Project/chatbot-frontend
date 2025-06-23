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
  const updatingFromYjs = useRef(false);
  const updatingFromGojs = useRef(false);

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

    // 2. Y.Map для блоков и связей
    const yNodes = ydoc.getMap('nodes');
    const yLinks = ydoc.getMap('links');

    // --- Yjs -> GoJS ---
    const applyYjsToGojs = () => {
      if (!diagramRef.current) return;
      updatingFromYjs.current = true;
      const model = diagramRef.current.model;
      const yNodesArr = Array.from(yNodes.values());
      const yLinksArr = Array.from(yLinks.values());

      // --- Синхронизация узлов ---
      // 1. Удалить отсутствующие
      model.nodeDataArray.slice().forEach(node => {
        if (!yNodes.has(String(node.key))) {
          model.removeNodeData(node);
        }
      });
      // 2. Добавить новые и обновить существующие
      yNodesArr.forEach(yNode => {
        const localNode = model.findNodeDataForKey(yNode.key);
        if (!localNode) {
          model.addNodeData(yNode);
        } else {
          // Обновить только изменённые поля (глубокое сравнение для вложенных структур)
          Object.keys(yNode).forEach(field => {
            const yVal = yNode[field];
            const lVal = localNode[field];
            const isObject = val => val && typeof val === 'object';
            let changed = false;
            if (isObject(yVal) && isObject(lVal)) {
              changed = JSON.stringify(yVal) !== JSON.stringify(lVal);
            } else {
              changed = yVal !== lVal;
            }
            if (changed) {
              model.setDataProperty(localNode, field, yVal);
            }
          });
          // Удалить поля, которых больше нет в yNode
          Object.keys(localNode).forEach(field => {
            if (!(field in yNode) && field !== 'key') {
              model.setDataProperty(localNode, field, undefined);
            }
          });
        }
      });

      // --- Синхронизация связей ---
      model.linkDataArray.slice().forEach(link => {
        if (!yLinks.has(String(link.key))) {
          model.removeLinkData(link);
        }
      });
      yLinksArr.forEach(yLink => {
        const localLink = model.findLinkDataForKey(yLink.key);
        if (!localLink) {
          model.addLinkData(yLink);
        } else {
          Object.keys(yLink).forEach(field => {
            const yVal = yLink[field];
            const lVal = localLink[field];
            const isObject = val => val && typeof val === 'object';
            let changed = false;
            if (isObject(yVal) && isObject(lVal)) {
              changed = JSON.stringify(yVal) !== JSON.stringify(lVal);
            } else {
              changed = yVal !== lVal;
            }
            if (changed) {
              model.setDataProperty(localLink, field, yVal);
            }
          });
          Object.keys(localLink).forEach(field => {
            if (!(field in yLink) && field !== 'key') {
              model.setDataProperty(localLink, field, undefined);
            }
          });
        }
      });

      updatingFromYjs.current = false;
    };
    yNodes.observeDeep(applyYjsToGojs);
    yLinks.observeDeep(applyYjsToGojs);

    // --- GoJS -> Yjs ---
    const onModelChanged = (e) => {
      if (updatingFromYjs.current) return;
      if (!diagramRef.current) return;
      // --- Добавление блока ---
      if (e.change === go.ChangedEvent.Insert && e.propertyName === 'nodeDataArray') {
        const node = e.newValue;
        if (node && node.key != null) {
          updatingFromGojs.current = true;
          yNodes.set(String(node.key), node);
          updatingFromGojs.current = false;
        }
      }
      // --- Удаление блока ---
      else if (e.change === go.ChangedEvent.Remove && e.propertyName === 'nodeDataArray') {
        const node = e.oldValue;
        if (node && node.key != null) {
          updatingFromGojs.current = true;
          yNodes.delete(String(node.key));
          updatingFromGojs.current = false;
        }
      }
      // --- Любые изменения свойств блока, включая вложенные массивы (options, conditions, itemArray) ---
      else if (
        e.change === go.ChangedEvent.Property &&
        (
          e.object instanceof go.Node ||
          e.modelChange === 'nodeDataArray' ||
          e.propertyName === 'itemArray' // для itemArray GoJS
        )
      ) {
        const node = e.object;
        // node.data гарантированно есть у go.Node, иначе fallback на node
        const data = node && node.data ? node.data : node;
        if (data && data.key != null) {
          updatingFromGojs.current = true;
          yNodes.set(String(data.key), data);
          updatingFromGojs.current = false;
        }
      }
      // --- Добавление связи ---
      else if (e.change === go.ChangedEvent.Insert && e.propertyName === 'linkDataArray') {
        const link = e.newValue;
        if (link && link.key != null) {
          updatingFromGojs.current = true;
          yLinks.set(String(link.key), link);
          updatingFromGojs.current = false;
        }
      }
      // --- Удаление связи ---
      else if (e.change === go.ChangedEvent.Remove && e.propertyName === 'linkDataArray') {
        const link = e.oldValue;
        if (link && link.key != null) {
          updatingFromGojs.current = true;
          yLinks.delete(String(link.key));
          updatingFromGojs.current = false;
        }
      }
      // --- Любые изменения свойств связи ---
      else if (
        e.change === go.ChangedEvent.Property &&
        (e.object instanceof go.Link || e.modelChange === 'linkDataArray')
      ) {
        const link = e.object;
        const data = link && link.data ? link.data : link;
        if (data && data.key != null) {
          updatingFromGojs.current = true;
          yLinks.set(String(data.key), data);
          updatingFromGojs.current = false;
        }
      }
    };
    diagramRef.current.addModelChangedListener(onModelChanged);

    // --- Инициализация: если Yjs пустой — записать локальные данные ---
    if (yNodes.size === 0 && diagramRef.current) {
      diagramRef.current.model.nodeDataArray.forEach(node => {
        if (node.key != null) yNodes.set(String(node.key), node);
      });
    } else {
      applyYjsToGojs();
    }
    if (yLinks.size === 0 && diagramRef.current) {
      diagramRef.current.model.linkDataArray.forEach(link => {
        if (link.key != null) yLinks.set(String(link.key), link);
      });
    } else {
      applyYjsToGojs();
    }

    return () => {
      yNodes.unobserveDeep(applyYjsToGojs);
      yLinks.unobserveDeep(applyYjsToGojs);
      diagramRef.current.removeModelChangedListener(onModelChanged);
      provider.disconnect();
      ydoc.destroy();
    };
  }, [enabled, diagramRef, projectId]);
} 