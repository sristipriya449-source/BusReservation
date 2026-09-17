import { useState, useEffect } from 'react';
import { getSeatPosition, getSeatFare, calculateTotalFare, getFareBreakdown } from '../utils/seatPricing';

// Helper to check if two seats form an adjacent pair in the same row
export const areSeatsPaired = (seatA, seatB) => {
  if (!seatA || !seatB) return false;
  const s1 = Math.min(Number(seatA), Number(seatB));
  const s2 = Math.max(Number(seatA), Number(seatB));
  const row1 = Math.floor((s1 - 1) / 4);
  const row2 = Math.floor((s2 - 1) / 4);
  if (row1 !== row2) return false;
  const pos1 = (s1 - 1) % 4;
  const pos2 = (s2 - 1) % 4;
  return (pos1 === 0 && pos2 === 1) || (pos1 === 2 && pos2 === 3);
};

export default function BookingForm({ selectedSeats = [], farePerSeat = 0, onSubmit, loading }) {
  const [isCouple, setIsCouple] = useState(false);
  const [passengerPhone, setPassengerPhone] = useState('');
  const [singleName, setSingleName] = useState('');
  const [, setConfigVersion] = useState(0);
  const [passengers, setPassengers] = useState([
    { name: '', gender: 'male' },
    { name: '', gender: 'female' },
  ]);
  const [errorMessage, setErrorMessage] = useState('');

  // Re-calculate live whenever pricing config is modified on frontend
  useEffect(() => {
    const handler = () => setConfigVersion((v) => v + 1);
    window.addEventListener('pricing-config-changed', handler);
    return () => window.removeEventListener('pricing-config-changed', handler);
  }, []);

  const numSeats = selectedSeats?.length || 0;
  const totalFare = calculateTotalFare(farePerSeat, selectedSeats);
  const breakdown = getFareBreakdown(farePerSeat, selectedSeats);

  // Sync passengers array length when seat count changes (if not in couple mode)
  // NOTE: `passengers` is intentionally excluded from deps to avoid an infinite re-render loop:
  // adding it would cause setPassengers → passengers changes → effect fires again → repeat.
  useEffect(() => {
    if (numSeats === 2) {
      setPassengers((prev) => {
        if (prev.length === 2) return prev; // already correct length, no-op
        return [
          { name: singleName || prev[0]?.name || '', gender: prev[0]?.gender || 'male' },
          { name: prev[1]?.name || '', gender: prev[1]?.gender || 'female' },
        ];
      });
    } else if (numSeats > 2) {
      setPassengers((prev) => {
        const next = [...prev];
        while (next.length < numSeats) {
          next.push({ name: '', gender: 'male' });
        }
        return next.slice(0, numSeats);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numSeats, singleName]);

  const handlePassengerChange = (index, field, value) => {
    setPassengers((prev) => {
      const next = [...prev];
      if (!next[index]) next[index] = { name: '', gender: 'male' };
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    if (errorMessage) setErrorMessage('');
  };

  const handleCoupleToggle = (checked) => {
    setIsCouple(checked);
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (numSeats === 0) {
      setErrorMessage('Please select at least one seat from the seat map to proceed.');
      return;
    }

    if (numSeats === 1 && !singleName.trim()) {
      setErrorMessage('Please enter the passenger name to proceed.');
      return;
    }

    const isPaired = numSeats === 2 && areSeatsPaired(selectedSeats[0], selectedSeats[1]);

    // 1. Couple Mode Validation
    if (isCouple) {
      if (numSeats !== 2 || !isPaired) {
        setErrorMessage('Couple booking requires selecting exactly 2 adjacent paired seats in the same row.');
        return;
      }
      if (!passengers[0]?.name?.trim() || !passengers[1]?.name?.trim()) {
        setErrorMessage('Please enter names for both Passenger 1 and Passenger 2.');
        return;
      }
    }

    // 2. 2-Seat Booking Gender Rule Validation
    if (numSeats === 2 && isPaired) {
      const g1 = passengers[0]?.gender || 'female';
      const g2 = passengers[1]?.gender || 'male';
      const isOppositeGender = g1 !== g2;

      if (isOppositeGender && !isCouple) {
        setErrorMessage(
          "These seats are reserved for couples or same-gender pairs. Please select 'Booking for a couple' or choose different seats."
        );
        return;
      }
    }

    setErrorMessage('');

    // Prepare payload
    let effectivePassengerName = '';
    let effectivePassengers = [];

    if (numSeats === 1) {
      effectivePassengerName = singleName.trim();
      effectivePassengers = [{ name: singleName.trim(), gender: 'other' }];
    } else {
      effectivePassengers = passengers.slice(0, numSeats).map((p) => ({
        name: p.name.trim(),
        gender: p.gender,
      }));
      effectivePassengerName = effectivePassengers.map((p) => p.name).filter(Boolean).join(', ');
    }

    onSubmit({
      passengerName: effectivePassengerName,
      passengerPhone: passengerPhone.trim(),
      seats: selectedSeats,
      totalFare,
      isCouple,
      passengers: effectivePassengers,
    });
  };

  return (
    <form className="glass-card seat-panel booking-form-container" onSubmit={handleSubmit}>
      <div className="seat-panel-header">
        <div className="seat-panel-title">Passenger Details</div>
        <div className="seat-panel-sub">Enter traveler contact details for official e-ticket delivery</div>
      </div>

      {errorMessage && (
        <div className="auth-error" role="alert">
          ⚠️ {errorMessage}
        </div>
      )}

      {numSeats === 0 && !errorMessage && (
        <div className="seat-notice-hint">
          ℹ️ Choose seat(s) on the interactive map to complete your booking
        </div>
      )}

      {/* Couple Booking Toggle */}
      <div className="couple-toggle-wrap">
        <label className="couple-toggle-label">
          <input
            type="checkbox"
            checked={isCouple}
            onChange={(e) => handleCoupleToggle(e.target.checked)}
            className="couple-checkbox"
          />
          <span className="couple-toggle-text">
            <strong>Booking for a couple?</strong> (Requires 2 adjacent paired seats)
          </span>
        </label>
        {isCouple && numSeats === 2 && !areSeatsPaired(selectedSeats[0], selectedSeats[1]) && (
          <div className="couple-warning-hint">
            ⚠️ Selected seats ({selectedSeats.join(', ')}) are not side-by-side in the same row. Please pick an adjacent pair.
          </div>
        )}
      </div>

      {/* Passenger Input Fields */}
      {numSeats === 1 && !isCouple && (
        <div className="auth-field">
          <label>
            Full Name <span className="field-seat-pill">Seat {selectedSeats[0]} ({getSeatPosition(selectedSeats[0]).type} · ₹{getSeatFare(farePerSeat, selectedSeats[0])})</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Ananya Sen"
            value={singleName}
            onChange={(e) => {
              setSingleName(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            required
          />
        </div>
      )}

      {(numSeats === 2 || isCouple) && (
        <div className="couple-passengers-grid">
          {/* Passenger 1 */}
          <div className="passenger-subcard">
            <div className="passenger-subcard-title">
              Traveller 1 (Seat {selectedSeats[0] || '1'} — {getSeatPosition(selectedSeats[0] || 1).type} · ₹{getSeatFare(farePerSeat, selectedSeats[0] || 1)})
            </div>
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={passengers[0]?.name || ''}
                onChange={(e) => handlePassengerChange(0, 'name', e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label>Gender</label>
              <select
                value={passengers[0]?.gender || 'male'}
                onChange={(e) => handlePassengerChange(0, 'gender', e.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Passenger 2 */}
          <div className="passenger-subcard">
            <div className="passenger-subcard-title">
              Traveller 2 (Seat {selectedSeats[1] || '2'} — {getSeatPosition(selectedSeats[1] || 2).type} · ₹{getSeatFare(farePerSeat, selectedSeats[1] || 2)})
            </div>
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={passengers[1]?.name || ''}
                onChange={(e) => handlePassengerChange(1, 'name', e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label>Gender</label>
              <select
                value={passengers[1]?.gender || 'female'}
                onChange={(e) => handlePassengerChange(1, 'gender', e.target.value)}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {numSeats > 2 && !isCouple && (
        <div className="multi-passengers-list">
          {selectedSeats.map((seatNum, idx) => {
            const pos = getSeatPosition(seatNum);
            const sFare = getSeatFare(farePerSeat, seatNum);
            return (
              <div key={seatNum} className="passenger-subcard" style={{ marginBottom: '12px' }}>
                <div className="passenger-subcard-title">
                  Passenger {idx + 1} (Seat {seatNum} — {pos.type} · ₹{sFare})
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div className="auth-field" style={{ margin: 0 }}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder={`Passenger ${idx + 1} Name`}
                      value={passengers[idx]?.name || ''}
                      onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-field" style={{ margin: 0 }}>
                    <label>Gender</label>
                    <select
                      value={passengers[idx]?.gender || 'male'}
                      onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="auth-field" style={{ marginTop: '16px' }}>
        <label>Primary Phone Number</label>
        <input
          type="tel"
          placeholder="e.g. 9830012345"
          value={passengerPhone}
          onChange={(e) => {
            setPassengerPhone(e.target.value);
            if (errorMessage) setErrorMessage('');
          }}
          required
        />
      </div>

      {/* Itemized Price Breakdown */}
      {numSeats > 0 && (
        <div className="fare-breakdown-card">
          <div className="fare-breakdown-title">Fare Breakdown</div>
          {breakdown.windowSeats.length > 0 && (
            <div className="fare-breakdown-row">
              <span>🪟 {breakdown.windowSeats.length}x Window Seat ({breakdown.windowSeats.map(s => `Seat ${s}`).join(', ')}) @ ₹{breakdown.windowUnitFare}</span>
              <strong>₹{breakdown.windowTotal}</strong>
            </div>
          )}
          {breakdown.aisleSeats.length > 0 && (
            <div className="fare-breakdown-row">
              <span>🚶 {breakdown.aisleSeats.length}x Aisle Seat ({breakdown.aisleSeats.map(s => `Seat ${s}`).join(', ')}) @ ₹{breakdown.aisleUnitFare}</span>
              <strong>₹{breakdown.aisleTotal}</strong>
            </div>
          )}
          <div className="fare-breakdown-row subtext">
            <span>GST (5%) &amp; Travel Pass Insurance</span>
            <span style={{ color: 'var(--emerald-600)', fontWeight: 600 }}>Included</span>
          </div>
        </div>
      )}

      <div className="bus-bottom" style={{ marginTop: '24px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {numSeats} seat{numSeats === 1 ? '' : 's'} {isCouple ? '(Couple Pass)' : ''}
          </div>
          <div className="bus-price">₹{totalFare}</div>
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || numSeats === 0}
        >
          {loading ? 'Processing...' : 'Confirm Booking'}
        </button>
      </div>
    </form>
  );
}
