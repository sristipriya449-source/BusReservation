/**
 * Dynamic Frontend Seat Pricing Utility
 * Allows dynamic calculation and live configuration of Window vs Aisle pricing directly in the frontend.
 */

const DEFAULT_CONFIG = {
  pricingMode: 'percentage', // 'percentage' | 'flat'
  windowPremiumPercent: 12,  // Default +12% for window seats
  minWindowPremium: 50,      // Minimum surcharge in INR
  flatSurcharge: 60,         // Flat surcharge in INR if flat mode is chosen
};

export const getPricingConfig = () => {
  try {
    const saved = localStorage.getItem('citylink_pricing_config');
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_CONFIG;
};

export const savePricingConfig = (newConfig) => {
  try {
    const merged = { ...getPricingConfig(), ...newConfig };
    localStorage.setItem('citylink_pricing_config', JSON.stringify(merged));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pricing-config-changed', { detail: merged }));
    }
    return merged;
  } catch (e) {
    return getPricingConfig();
  }
};

export const getSeatPosition = (seatNumber) => {
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

export const getSeatType = (seatNumber) => {
  return getSeatPosition(seatNumber).type;
};

export const getSeatFare = (baseFare, seatNumber, customConfig = null) => {
  const fare = Number(baseFare) || 0;
  const { isWindow } = getSeatPosition(seatNumber);
  if (!isWindow) {
    // Aisle / inner seat is standard base price
    return fare;
  }

  // Dynamic Window Pricing calculated directly on the frontend
  const cfg = customConfig || getPricingConfig();
  if (cfg.pricingMode === 'flat') {
    const surcharge = Number(cfg.flatSurcharge) || 50;
    return fare + surcharge;
  }

  // Percentage mode (default)
  const percent = Number(cfg.windowPremiumPercent) || 12;
  const minPremium = Number(cfg.minWindowPremium) || 50;
  const calculatedPremium = Math.max(minPremium, Math.round((fare * (percent / 100)) / 10) * 10);
  return fare + calculatedPremium;
};

export const calculateTotalFare = (baseFare, seats = [], customConfig = null) => {
  if (!Array.isArray(seats) || seats.length === 0) return 0;
  return seats.reduce((total, seatNum) => total + getSeatFare(baseFare, seatNum, customConfig), 0);
};

export const getFareBreakdown = (baseFare, seats = [], customConfig = null) => {
  const fare = Number(baseFare) || 0;
  const windowSeats = (seats || []).filter((s) => getSeatPosition(s).isWindow);
  const aisleSeats = (seats || []).filter((s) => !getSeatPosition(s).isWindow);

  const windowUnitFare = getSeatFare(fare, 1, customConfig);
  const aisleUnitFare = getSeatFare(fare, 2, customConfig);

  const windowTotal = windowSeats.reduce((acc, s) => acc + getSeatFare(fare, s, customConfig), 0);
  const aisleTotal = aisleSeats.reduce((acc, s) => acc + getSeatFare(fare, s, customConfig), 0);
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
