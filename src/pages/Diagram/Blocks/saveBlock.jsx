import * as go from "gojs";
import createPort from "./createPort";


const $ = go.GraphObject.make;
const saveBlock =$(

  go.Node,
  "Auto",
  $(go.Shape, "RoundedRectangle", { stroke: "green", strokeWidth: 2, fill: "rgba(86,254,67,0.25)" }),
  $(go.Panel, "Table")
    .addColumnDefinition(0, { alignment: go.Spot.Left })
    .addColumnDefinition(1, { alignment: go.Spot.Center })
    .addColumnDefinition(2, { alignment: go.Spot.Right })
    .add(
      new go.TextBlock(
        { column: 0, row: 0, columnSpan: 4, alignment: go.Spot.Center,
          text: "Save Block",
          font: "bold 8pt sans-serif", margin: new go.Margin(4, 2) , stroke:"rgba(204, 255, 209, 1)"}),
      $(go.TextBlock,
        {column: 1, row: 1, editable: true, isMultiline: false, alignment: go.Spot.Center,
          font: "bold 10pt sans-serif", margin: new go.Margin(2, 2), stroke:"rgba(204, 255, 209, 1)" },
        new go.Binding("text", "name").makeTwoWay(),
      ),

      $(go.TextBlock,
        {column: 1, row: 2, editable: true, isMultiline: false, alignment: go.Spot.Center,
          font: "bold 10pt sans-serif", margin: new go.Margin(2, 2), stroke:"rgba(204, 255, 209, 1)" },
        new go.Binding("text", "value").makeTwoWay(),
      ),
      new go.Panel("Horizontal", { column: 0, row: 1 }).add(
        createPort("IN", go.Spot.Left, true, "rgba(67, 255, 86, 1)")
      ),
      new go.Panel("Horizontal", { column: 2, row: 1 }).add(
        createPort("OUT", go.Spot.Right, false, "rgba(67, 255, 86, 1)")
      ),
    ),
  )
export default saveBlock;