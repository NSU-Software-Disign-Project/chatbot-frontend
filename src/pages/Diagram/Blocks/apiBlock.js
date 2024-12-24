import * as go from "gojs";
import createPort from "./createPort";


const $ = go.GraphObject.make;
const saveBlock =$(

  go.Node,
  "Auto",
  $(go.Shape, "RoundedRectangle", { stroke: "#bdcee2", strokeWidth: 2, fill: "rgba(127,141,153,0.25)" }),
  $(go.Panel, "Table")
    .addColumnDefinition(0, { alignment: go.Spot.Left })
    .addColumnDefinition(1, { alignment: go.Spot.Center })
    .addColumnDefinition(2, { alignment: go.Spot.Right })
    .add(
      new go.TextBlock(
        { column: 0, row: 0, columnSpan: 3, alignment: go.Spot.Center,
          text: "API Block",
          font: "bold 8pt sans-serif", margin: new go.Margin(4, 2) , stroke:"#c6d9ef"}),
      $(go.TextBlock,
        {column: 1, row: 1, editable: true, isMultiline: false, alignment: go.Spot.Center,
          font: "bold 10pt sans-serif", margin: new go.Margin(2, 18), stroke:"#c6d9ef" },
        new go.Binding("text", "link").makeTwoWay(),
      ),
      $(go.TextBlock,
        {column: 1, row: 2, editable: true, isMultiline: false, alignment: go.Spot.Center,
          font: "bold 10pt sans-serif", margin: new go.Margin(2, 18), stroke:"#c6d9ef" },
        new go.Binding("text", "variable").makeTwoWay(),
      ),
      new go.Panel("Horizontal", { column: 0, row: 1 }).add(
        createPort("IN", go.Spot.Left, true, "#bfcfe5")
      ),
      new go.Panel("Horizontal", { column: 2, row: 1 }).add(
        createPort("OUT", go.Spot.Right, false, "#bfcfe5")
      ),
    ),
)
export default saveBlock;