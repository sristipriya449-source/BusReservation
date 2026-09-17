import { useState, useEffect, useMemo } from 'react';
import { getSeatPosition, getSeatFare, calculateTotalFare } from '../utils/seatPricing';

export default function SeatMap({
  totalSeats = 32,
  bookedSeats = [],
  selectedSeats,
  onChange,
  farePerSeat = 0,
}) {
  const [internalSelected, setInternalSelected] = useState(selectedSeats || []);
  const [, setConfigVersion] = useState(0);
  const safeBookedSeats = useMemo(() => (Array.isArray(bookedSeats) ? bookedSeats : []), [bookedSeats]);
  const selected = selectedSeats !== undefined ? selectedSeats : internalSelected;

  // Re-render immediately when admin updates dynamic pricing on the frontend
  useEffect(() => {
    const handler = () => setConfigVersion((v) => v + 1);
    window.addEventListener('pricing-config-changed', handler);
    return () => window.removeEventListener('pricing-config-changed', handler);
  }, []);

  // Auto-remove any seats from selection if they become booked
  useEffect(() => {
    if (selectedSeats !== undefined) {
      if (selectedSeats.some((s) => safeBookedSeats.includes(s))) {
        const filtered = selectedSeats.filter((s) => !safeBookedSeats.includes(s));
        onChange?.(filtered);
      }
    } else {
      setInternalSelected((prev) => {
        const filtered = prev.filter((s) => !safeBookedSeats.includes(s));
        if (filtered.length !== prev.length) {
          onChange?.(filtered);
        }
        return filtered;
      });
    }
  }, [safeBookedSeats, selectedSeats, onChange]);

  const toggleSeat = (seatNumber) => {
    if (safeBookedSeats.includes(seatNumber)) return;
    const nextSelected = selected.includes(seatNumber)
      ? selected.filter((s) => s !== seatNumber)
      : [...selected, seatNumber];

    if (selectedSeats !== undefined) {
      onChange?.(nextSelected);
    } else {
      setInternalSelected(nextSelected);
      onChange?.(nextSelected);
    }
  };

  const numSeats = Number(totalSeats) > 0 ? Number(totalSeats) : 32;
  const numRows = Math.ceil(numSeats / 4);

  const windowUnitFare = getSeatFare(farePerSeat, 1);
  const aisleUnitFare = getSeatFare(farePerSeat, 2);
  const totalCalculatedFare = calculateTotalFare(farePerSeat, selected);

  // Group seats into 2x2 rows with center aisle
  const rows = [];
  for (let r = 0; r < numRows; r++) {
    const leftWindow = r * 4 + 1 <= numSeats ? r * 4 + 1 : null;
    const leftAisle = r * 4 + 2 <= numSeats ? r * 4 + 2 : null;
    const rightAisle = r * 4 + 3 <= numSeats ? r * 4 + 3 : null;
    const rightWindow = r * 4 + 4 <= numSeats ? r * 4 + 4 : null;
    rows.push({
      rowNum: r + 1,
      left: [
        { num: leftWindow, type: 'Window', isWindow: true },
        { num: leftAisle, type: 'Aisle', isWindow: false },
      ],
      right: [
        { num: rightAisle, type: 'Aisle', isWindow: false },
        { num: rightWindow, type: 'Window', isWindow: true },
      ],
    });
  }

  const renderSeatItem = (item, rowNum, colIdx) => {
    if (!item.num) return <div className="seat-spacer" key={`spacer-r${rowNum}-c${colIdx}`} />;
    const isBooked = safeBookedSeats.includes(item.num);
    const isSelected = selected.includes(item.num);
    const seatPrice = getSeatFare(farePerSeat, item.num);

    return (
      <button
        key={item.num}
        type="button"
        className={`seat ${item.isWindow ? 'seat-window' : 'seat-aisle'} ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => toggleSeat(item.num)}
        disabled={isBooked}
        title={`Seat ${item.num} (${item.type} — ₹${seatPrice}) • ${isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}`}
        aria-label={`Seat ${item.num} ${item.type} ₹${seatPrice} ${isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}`}
      >
        <div className="seat-top-row">
          <span className="seat-num">{item.num}</span>
          <span className={`seat-badge-pill ${item.isWindow ? 'pill-window' : 'pill-aisle'}`}>
            {item.isWindow ? 'W' : 'A'}
          </span>
        </div>
        {isSelected ? (
          <span className="seat-check">✓</span>
        ) : (
          <span className="seat-price-tag">₹{seatPrice}</span>
        )}
      </button>
    );
  };

  return (
    <div className="glass-card seat-panel">
      <div className="seat-panel-header">
        <div>
          <div className="seat-panel-title">Interactive Seat Map</div>
          <div className="seat-panel-sub">Select your preferred window or aisle seats (side-by-side pairs for couples)</div>
        </div>
        <div className="seat-pricing-pills">
          <span className="price-pill window-price-pill" title="Window seat with panoramic road view">
            🪟 Window: <strong>₹{windowUnitFare}</strong>
          </span>
          <span className="price-pill aisle-price-pill" title="Aisle seat with extra legroom & quick exit">
            🚶 Aisle: <strong>₹{aisleUnitFare}</strong>
          </span>
        </div>
      </div>

      {/* Prominent Legend */}
      <div className="legend">
        <div className="legend-item">
          <span className="dot available-dot" />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="dot booked-dot" />
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <span className="dot selected-dot" />
          <span>Selected</span>
        </div>
        <div className="legend-divider" />
        <div className="legend-item seat-types-hint">
          <span className="badge-hint badge-hint-window">W</span> Window (₹{windowUnitFare})
          <span className="badge-hint badge-hint-aisle" style={{ marginLeft: '12px' }}>A</span> Aisle (₹{aisleUnitFare})
        </div>
      </div>

      {/* Real Bus Interior Chassis with Orientation */}
      <div className="bus-interior-chassis">
        {/* Front of Bus Orientation Indicator */}
        <div className="bus-front-header">
          <div className="driver-cabin">
            <span>🛞</span>
            <span>Driver Area</span>
          </div>
          <div className="bus-entry">
            <span>Door</span>
            <span>🚪</span>
          </div>
        </div>

        {/* 2x2 Rows with Central Aisle */}
        <div className="bus-seating-grid">
          {rows.map((row) => (
            <div className="bus-seat-row" key={row.rowNum}>
              <div className="seat-pair left-pair" title={`Row ${row.rowNum} Left (Window + Aisle)`}>
                {row.left.map((item, colIdx) => renderSeatItem(item, row.rowNum, colIdx))}
              </div>
              <div className="aisle-spacer">
                <span className="aisle-num">{row.rowNum}</span>
              </div>
              <div className="seat-pair right-pair" title={`Row ${row.rowNum} Right (Aisle + Window)`}>
                {row.right.map((item, colIdx) => renderSeatItem(item, row.rowNum, colIdx + 2))}
              </div>
            </div>
          ))}
        </div>

        <div className="bus-rear-label">Rear of Bus</div>
      </div>

      {/* Live Running Summary */}
      <div className="seat-selection-summary">
        <div className="summary-left">
          <div className="summary-label">Selected Seats ({selected.length})</div>
          <div className="summary-seats-list">
            {selected.length > 0 ? (
              selected.map((s) => {
                const pos = getSeatPosition(s);
                const sFare = getSeatFare(farePerSeat, s);
                return (
                  <span key={s} className={`selected-seat-chip ${pos.isWindow ? 'chip-window' : 'chip-aisle'}`}>
                    <strong>Seat {s}</strong> ({pos.type} · ₹{sFare})
                    <span
                      className="chip-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSeat(s);
                      }}
                      title="Remove seat"
                    >
                      ×
                    </span>
                  </span>
                );
              })
            ) : (
              <span className="no-seats-hint">No seats selected yet — click any window or aisle seat above</span>
            )}
          </div>
        </div>
        <div className="summary-right">
          <div className="summary-count">
            {selected.length} seat{selected.length === 1 ? '' : 's'}
          </div>
          {farePerSeat > 0 && (
            <div className="summary-total-fare">₹{totalCalculatedFare}</div>
          )}
        </div>
      </div>
    </div>
  );
}
