export function getBidAmounts(highestBid: unknown, basePrice: unknown) {
  const highest = Number(highestBid) || 0;
  const base = Number(basePrice) || 0;
  const previousHighest = Math.max(highest, base);
  return { previousHighest, minimumNextBid: previousHighest + 1 };
}
