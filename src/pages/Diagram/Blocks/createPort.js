import * as go from "gojs";

const $ = go.GraphObject.make;
const createPort = (portId, spot, isInput, color) => {
  return $(go.Panel, "Horizontal",
    $(go.Shape, {
      figure: "Circle",
      width: 8,
      height: 8,
      portId: portId,
      toSpot: isInput ? spot : go.Spot.Right,
      fromSpot: isInput ? go.Spot.Right : go.Spot.Right,
      toLinkable: isInput,
      fromLinkable: !isInput,
      toMaxLinks: isInput ? 1 : 10,
      cursor: "pointer",
      fill: color,
      stroke:null,
    }),
  );
};
export default createPort;