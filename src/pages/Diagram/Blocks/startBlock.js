import * as go from "gojs";
import createPort from "./createPort";
import { nodeContextMenu } from "./diagram";

const $ = go.GraphObject.make;

const startBlock = $(
  go.Node,
  "Auto",
  { contextMenu: nodeContextMenu },
  // Background and border
  $(go.Shape, "RoundedRectangle", {
    fill: "rgba(93, 0, 255, 0.25)", // Dark purple with transparency
    stroke: "#7d3cff", // Bright purple border
    strokeWidth: 2,
  }),
  // Content panel
  $(go.Panel, "Table")
    .addColumnDefinition(0, { alignment: go.Spot.Left })
    .addColumnDefinition(1, { alignment: go.Spot.Center })
    .addColumnDefinition(2, { alignment: go.Spot.Right })
    .add(
      // Block title
      new go.TextBlock({
        column: 0,
        row: 0,
        columnSpan: 3,
        alignment: go.Spot.Center,
        text: "Start Block",
        font: "bold 14pt sans-serif",
        margin: new go.Margin(8, 16),
        stroke: "#fff", // White text
      }),
      // Editable start text
      $(
        go.TextBlock,
        {
          column: 1,
          row: 1,
          editable: true,
          isMultiline: false,
          alignment: go.Spot.Center,
          font: "bold 12pt sans-serif",
          margin: new go.Margin(8, 32),
          stroke: "#fff",
        },
        new go.Binding("text", "startText").makeTwoWay()
      ),
      // Output port only (start block doesn't have input)
      new go.Panel("Horizontal", { column: 2, row: 1 }).add(
        createPort("OUT", go.Spot.Right, false, "#7d3cff")
      )
    )
);

export default startBlock;
