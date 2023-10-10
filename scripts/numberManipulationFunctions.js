export function roundToNearestTick(x, tickSize, decimalLength) {
  // this is for arranging the scale's custom tick values
  return parseFloat(
    (Math.round(x / tickSize) * tickSize).toFixed(decimalLength)
  );
}
