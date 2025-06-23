import * as go from "gojs";

const $ = go.GraphObject.make;
const createPort = (portId, spot, isInput, color) => {
  const shapeProps = {
    figure: "Circle",
    width: 8,
    height: 8,
    portId: portId,
    toSpot: isInput ? spot : go.Spot.Right,
    fromSpot: isInput ? go.Spot.Right : go.Spot.Right,
    toLinkable: isInput,
    fromLinkable: !isInput,
    cursor: "pointer",
    fill: color,
    stroke: null,
    margin: 2,
  };
  if (!isInput) {
    shapeProps.fromMaxLinks = 1;
  }
  return $(go.Panel, "Horizontal",
    $(go.Shape, shapeProps),
  );
};
export default createPort;