import * as go from "gojs";
import createPort from "./createPort";

const $ = go.GraphObject.make;
const messageBlock =
  $(
    go.Node,
    "Auto",
    $(go.Shape, "RoundedRectangle", {stroke: "darkblue", strokeWidth: 2, fill: "rgba(51,0,255,0.25)"}),
    $(go.Panel, "Table")
      .addColumnDefinition(0, { alignment: go.Spot.Left })
      .addColumnDefinition(1, { alignment: go.Spot.Center })
      .addColumnDefinition(2, { alignment: go.Spot.Right })
      .add(

        $(go.TextBlock,
          { column: 0, row: 0, columnSpan: 4, alignment: go.Spot.Center,
            font: "bold 8pt sans-serif", stroke: "rgba(189, 164, 254, 1)",margin: new go.Margin(4, 2), text: "Message Block",  })
        ,
        $(go.TextBlock,
          {column: 1, row: 1, editable: true, isMultiline: false, alignment: go.Spot.Center,
            font: "bold 10pt sans-serif", stroke:"rgba(189, 164, 254, 1)", margin: new go.Margin(4, 2) },
          new go.Binding("text", "message").makeTwoWay()
        ),

        new go.Panel("Horizontal", { column: 0, row: 1 }).add(
          createPort("IN", go.Spot.Left, true, "rgba(51, 0, 255, 1)")
        ),
        new go.Panel("Horizontal", { column: 2, row: 1 }).add(
          createPort("OUT", go.Spot.Right, false, "rgba(51, 0, 255, 1)")
        ),
      ),
  );
export default messageBlock;