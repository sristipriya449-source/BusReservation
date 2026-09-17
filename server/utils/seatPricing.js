/**
 * Seat Pricing Utility (Backend)
 * Window Seats: Higher price (premium window view)
 * Aisle / Other Side Seats: Lower standard price
 */

const getSeatPosition = (seatNumber) => {
  const num = Number(seatNumber);
  if (!num || num < 1) return { row: 1, col: 1, type: 'Window', isWindow: true, isAisle: false };
  const col = ((num - 1) % 4) + 1; // 1 = Left Window, 2 = Left Aisle, 3 = Right Aisle, 4 = Right Window
  const row = Math.floor((num - 1) / 4) + 1;
  const isWindow = col === 1 || col === 4;
  return {
    row,
    col,
    type: isWindow ? 'Window' : 'Aisle',
    isWindow,
    isAisle: !isWindow,
  };
};

const getSeatType = (seatNumber) => {
  return getSeatPosition(seatNumber).type;
};

const getSeatFare = (baseFare, seatNumber) => {
  const fare = Number(baseFare) || 0;
  const { isWindow } = getSeatPosition(seatNumber);
  if (isWindow) {
    // Window seat price is higher (12% premium, minimum +50, rounded to nearest 10)
    const premium = Math.max(50, Math.round((fare * 0.12) / 10) * 10);
    return fare + premium;
  }
  // Aisle / other side seat is standard lower price
  return fare;
};

const calculateTotalFare = (baseFare, seats = []) => {
  if (!Array.isArray(seats) || seats.length === 0) return 0;
  return seats.reduce((total, seatNum) => total + getSeatFare(baseFare, seatNum), 0);
};

const getFareBreakdown = (baseFare, seats = []) => {
  const fare = Number(baseFare) || 0;
  const windowSeats = (seats || []).filter((s) => getSeatPosition(s).isWindow);
  const aisleSeats = (seats || []).filter((s) => !getSeatPosition(s).isWindow);

  const windowUnitFare = getSeatFare(fare, 1);
  const aisleUnitFare = getSeatFare(fare, 2);

  const windowTotal = windowSeats.reduce((acc, s) => acc + getSeatFare(fare, s), 0);
  const aisleTotal = aisleSeats.reduce((acc, s) => acc + getSeatFare(fare, s), 0);
  const total = windowTotal + aisleTotal;

  return {
    windowSeats,
    aisleSeats,
    windowUnitFare,
    aisleUnitFare,
    windowTotal,
    aisleTotal,
    total,
  };
};

module.exports = {
  getSeatPosition,
  getSeatType,
  getSeatFare,
  calculateTotalFare,
  getFareBreakdown,
};
