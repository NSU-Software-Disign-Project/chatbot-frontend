import * as go from "gojs";

const $ = go.GraphObject.make;
const conditionalBlock = $(
  go.Node,
  "Spot",
  $(go.Panel, "Auto",
    $(go.Shape, "RoundedRectangle", {
      fill: "rgba(255,34,0,0.25)",
      stroke: "crimson", strokeWidth:2,
    }),
    $(
      go.Panel,
      "Vertical",
      $(
        go.TextBlock,

        { margin: 5, font: "bold 8pt sans-serif", stroke: "rgba(255, 187, 187, 1)", text:"Conditional Block"  },
      ),
      $(go.TextBlock,
        {column: 1, row: 1, editable: true, isMultiline: false, alignment: go.Spot.Center,
          font: "bold 10pt sans-serif", margin: new go.Margin(4, 2) , stroke: "rgba(255, 187, 187, 1)"},
        new go.Binding("text", "value").makeTwoWay()
      ),
      $(go.TextBlock,
        {column: 1, row: 2, editable: true, isMultiline: false, alignment: go.Spot.Center,
          font: "bold 8pt sans-serif", margin: new go.Margin(0, 2) , stroke: "rgba(255, 187, 187, 1)"},
        new go.Binding("text", "condition").makeTwoWay()
      ),
      $(go.TextBlock,
        {column: 1, row: 3, editable: true, isMultiline: false, alignment: go.Spot.Center,
          font: "bold 8pt sans-serif", margin: new go.Margin(0, 2) , stroke: "rgba(255, 187, 187, 1)"},
        new go.Binding("text", "conditionValue").makeTwoWay()
      )
    ),

  ),

  $(
    go.Panel,
    "Vertical",
    {
      alignment: go.Spot.Left,
      alignmentFocus: go.Spot.Left,
      name: "INPUT_PORTS",
      itemTemplate: $(
        go.Panel, "Horizontal",
        $(go.Shape, {
          figure: "Circle",
          width: 8,
          height: 8,
          portId: "IN",
          toSpot: go.Spot.Left,
          toLinkable: true,
          cursor: "pointer",
          margin: new go.Margin(2, 0, 0, 4),
          fill: "red",
          stroke:null

        }),

      ),
    },
    new go.Binding("itemArray", "inputs").makeTwoWay()
  ),
  $(
    go.Panel,
    "Vertical",
    {
      name: "OUTPUT_PORTS",
      alignment: go.Spot.Right,
      alignmentFocus: go.Spot.Right,

      itemTemplate: $(
        go.Panel,
        "Horizontal",
        $(
          go.Shape,
          {
            figure: "Circle",
            width: 8,
            height: 8,
            portId: "",
            fromSpot: go.Spot.Right,
            fromLinkable: true,
            cursor: "pointer",
            margin: new go.Margin(2, 4, 0, 4),
            fill: "red",
            stroke:null
          },
          new go.Binding("portId", "portId")
        ),
      ),
    },
    new go.Binding("itemArray", "outputs").makeTwoWay()
  ),
);
export default conditionalBlock;