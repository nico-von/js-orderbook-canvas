export function roundToNearestTick(x, tickSize) {
  // this is for arranging the scale's custom tick values
  return Math.round(x / tickSize) * tickSize;
}


export function sumAllValues(object) {
  return Object.values(object).reduce((a, b) => a + b, 0);
}

