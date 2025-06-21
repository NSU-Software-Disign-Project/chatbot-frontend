import React, { useEffect, useRef, useState } from 'react';

const AnimatedLogo = () => {
  const [nodes, setNodes] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    const getRandomColor = () => {
      const colors = ['#7c3aed', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#fbbf24'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const generateNodes = () => {
      const count = Math.floor(Math.random() * 5) + 6; // от 6 до 10 узлов
      const minDistance = 40;
      const maxAttempts = 100;
      const newNodes = [];

      const getRandomPosition = () => ({
        x: Math.random() * 180 + 10,
        y: Math.random() * 180 + 10,
      });

      for (let i = 0; i < count; i++) {
        let attempts = 0;
        let newPos;

        do {
          newPos = getRandomPosition();
          let tooClose = false;
          let colinear = false;

          // Проверка расстояния до других точек
          for (let j = 0; j < newNodes.length; j++) {
            const node = newNodes[j];
            const dx = newPos.x - node.x;
            const dy = newPos.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
              tooClose = true;
              break;
            }
          }

          // Проверка на коллинеарность (если есть минимум 2 точки)
          if (newNodes.length >= 2) {
            const p1 = newNodes[newNodes.length - 1];
            const p2 = newNodes[newNodes.length - 2];

            // Площадь треугольника между точками — если 0 → они на одной прямой
            const area = Math.abs(
              (p2.x - p1.x) * (newPos.y - p1.y) - (newPos.x - p1.x) * (p2.y - p1.y)
            );

            if (area < 5) {
              colinear = true;
            }
          }

          attempts++;

          // Если всё ок — добавляем точку
          if (!tooClose && !colinear) {
            newNodes.push({
              id: i,
              x: newPos.x,
              y: newPos.y,
              color: getRandomColor(),
            });
            break;
          }
        } while (attempts < maxAttempts);
      }

      // Fallback: если не хватило подходящих позиций
      while (newNodes.length < count) {
        newNodes.push({
          id: newNodes.length,
          x: Math.random() * 180 + 10,
          y: Math.random() * 180 + 10,
          color: getRandomColor(),
        });
      }

      // Связываем ближайшие узлы
      const links = [];
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
          const dx = newNodes[i].x - newNodes[j].x;
          const dy = newNodes[i].y - newNodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (links.at(i) === links.at(j)) {
            links.push({ source: i, target: j });
          }
        }
      }

      setNodes({ nodes: newNodes, links });
    };

    generateNodes();
  }, []);

  const getRandomColor = () => {
    const colors = ['#7c3aed', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#fbbf24'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (!nodes.nodes) return null;

  const { nodes: nodeList, links } = nodes;

  return (
    <svg ref={svgRef} width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* Линии */}
      {links.map((link, idx) => {
        const source = nodeList[link.source];
        const target = nodeList[link.target];
        return (
          <line
            key={`link-${idx}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke={source.color}
            strokeWidth="2"
            opacity="0.6"
          />
        );
      })}

      {/* Узлы */}
      {nodeList.map((node, idx) => (
        <g key={`node-${idx}`}>
          <circle cx={node.x} cy={node.y} r="6" fill={node.color} />
        </g>
      ))}

      {/* Активные точки */}
      {nodeList.length > 0 && (
        <>
          <circle cx={nodeList[0].x} cy={nodeList[0].y} r="3" fill="#ffffff">
            <animate attributeName="r" values="3;8;3" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </circle>

          <circle
            cx={nodeList[nodeList.length - 1].x}
            cy={nodeList[nodeList.length - 1].y}
            r="3"
            fill="#ffffff"
          >
            <animate attributeName="r" values="2;6;2" dur="2s" repeatCount="indefinite" begin="0.5s" />
            <animate
              attributeName="opacity"
              values="1;0.4;1"
              dur="2s"
              repeatCount="indefinite"
              begin="0.5s"
            />
          </circle>
        </>
      )}
    </svg>
  );
};

export default AnimatedLogo;