import { useState, useEffect } from 'react';
import { getSeatFare } from '../utils/seatPricing';

export default function BusCard({ route, expanded, onToggle }) {
  const [, setConfigVersion] = useState(0);

  useEffect(() => {
    const handler = () => setConfigVersion((v) => v + 1);
    window.addEventListener('pricing-config-changed', handler);
    return () => window.removeEventListener('pricing-config-changed', handler);
  }, []);

  const departure = route.departureTime
    ? new Date(route.departureTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  const aisleFare = getSeatFare(route.fare, 2);
  const windowFare = getSeatFare(route.fare, 1);

  return (
    <div className="glass-card bus-card">
      <div className="bus-top">
        <span>{route.bus?.type}</span>
        <span>★ {route.bus?.rating || '4.2'}</span>
      </div>
      <div className="bus-path">{route.source} → {route.destination}</div>
      <div className="bus-meta">{route.duration} · {departure} departure</div>
      <div className="bus-meta">{route.bus?.busName}</div>
      <div className="bus-bottom">
        <div className="bus-pricing-display">
          <span className="bus-price">₹{aisleFare}</span>
          <span className="bus-price-sub">Aisle · Window ₹{windowFare}</span>
        </div>
        <button className="btn-outline" onClick={() => onToggle?.(route._id)}>
          {expanded ? 'Close' : 'Select Seats'}
        </button>
      </div>
    </div>
  );
}
