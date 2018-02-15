export function getNumberOfSecondsBetweenDates(firstDate, secondDate): number {
  return Math.round(Math.abs((firstDate - secondDate)/(1000)));
}
