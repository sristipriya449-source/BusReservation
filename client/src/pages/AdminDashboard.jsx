import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { getSeatFare, getPricingConfig, savePricingConfig } from '../utils/seatPricing';

export default function AdminDashboard() {
  const [tab, setTab] = useState('routes');
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Frontend Dynamic Pricing Engine State
  const [pricingConfig, setPricingConfigState] = useState(getPricingConfig());
  const [configToast, setConfigToast] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Inline Price Editing state: { [routeId]: priceValue }
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  // Full Route Edit Modal state
  const [editRouteModal, setEditRouteModal] = useState(null);
  const [savingRoute, setSavingRoute] = useState(false);

  // Bus Edit Modal state
  const [editBusModal, setEditBusModal] = useState(null);
  const [savingBus, setSavingBus] = useState(false);

  // Creation forms
  const [busForm, setBusForm] = useState({
    busName: '',
    busNumber: '',
    type: 'Volvo Multi-axle',
    totalSeats: 40,
    rating: 4.8,
  });

  const [routeForm, setRouteForm] = useState({
    bus: '',
    source: '',
    destination: '',
    departureTime: '',
    duration: '4h 30m',
    fare: 500,
  });

  const [creatingRoute, setCreatingRoute] = useState(false);
  const [creatingBus, setCreatingBus] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/buses').then((res) => (Array.isArray(res.data) ? res.data : [])),
      api.get('/buses/routes').then((res) => (Array.isArray(res.data) ? res.data : [])),
      api.get('/bookings').then((res) => (Array.isArray(res.data) ? res.data : [])),
    ])
      .then(([busesData, routesData, bookingsData]) => {
        setBuses(busesData);
        setRoutes(routesData);
        setBookings(bookingsData);
      })
      .catch((err) => {
        console.error('Failed to load admin data', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ── Save Frontend Dynamic Pricing Rule ────────────────────
  const handleApplyPricingConfig = (newConfig) => {
    const updated = savePricingConfig(newConfig);
    setPricingConfigState(updated);
    setConfigToast('✓ Dynamic pricing rule updated and applied live across the platform!');
    setTimeout(() => setConfigToast(''), 3500);
  };

  // ── KPI Summary Calculations ──────────────────────────────
  const stats = useMemo(() => {
    const totalRevenue = bookings
      .filter((b) => b.status === 'confirmed')
      .reduce((sum, b) => sum + (Number(b.totalFare) || 0), 0);
    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;

    return {
      totalRoutes: routes.length,
      totalBuses: buses.length,
      totalBookings: bookings.length,
      confirmedCount,
      totalRevenue,
    };
  }, [routes, buses, bookings]);

  // ── Filtered Routes ───────────────────────────────────────
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const q = searchQuery.toLowerCase().trim();
    return routes.filter(
      (r) =>
        r.source?.toLowerCase().includes(q) ||
        r.destination?.toLowerCase().includes(q) ||
        r.bus?.busName?.toLowerCase().includes(q) ||
        r.bus?.busNumber?.toLowerCase().includes(q) ||
        String(r.fare).includes(q)
    );
  }, [routes, searchQuery]);

  // ── Quick Inline Price Update ─────────────────────────────
  const startInlinePriceEdit = (route) => {
    setEditingPriceId(route._id);
    setTempPrice(route.fare);
  };

  const cancelInlinePriceEdit = () => {
    setEditingPriceId(null);
    setTempPrice('');
  };

  const saveInlinePrice = async (routeId) => {
    const newFare = Number(tempPrice);
    if (!newFare || newFare <= 0) {
      alert('Please enter a valid positive fare amount.');
      return;
    }
    setSavingPrice(true);
    try {
      const res = await api.put(`/buses/routes/${routeId}`, { fare: newFare });
      setRoutes((prev) =>
        prev.map((r) => (r._id === routeId ? { ...r, fare: res.data.fare || newFare } : r))
      );
      setEditingPriceId(null);
      setTempPrice('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update price');
    } finally {
      setSavingPrice(false);
    }
  };

  // ── Route Creation ────────────────────────────────────────
  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!routeForm.bus || !routeForm.source || !routeForm.destination || !routeForm.departureTime) {
      alert('Please fill all required route fields.');
      return;
    }
    setCreatingRoute(true);
    try {
      const res = await api.post('/buses/routes', {
        ...routeForm,
        fare: Number(routeForm.fare) || 0,
      });
      setRoutes((prev) => [res.data, ...prev]);
      setRouteForm({
        bus: '',
        source: '',
        destination: '',
        departureTime: '',
        duration: '4h 30m',
        fare: 500,
      });
      alert('✓ Route created successfully with dynamic window & aisle pricing enabled!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add route');
    } finally {
      setCreatingRoute(false);
    }
  };

  // ── Route Full Update ─────────────────────────────────────
  const handleSaveEditRoute = async (e) => {
    e.preventDefault();
    if (!editRouteModal) return;
    setSavingRoute(true);
    try {
      const res = await api.put(`/buses/routes/${editRouteModal._id}`, {
        bus: editRouteModal.bus?._id || editRouteModal.bus,
        source: editRouteModal.source,
        destination: editRouteModal.destination,
        departureTime: editRouteModal.departureTime,
        duration: editRouteModal.duration,
        fare: Number(editRouteModal.fare),
      });
      setRoutes((prev) => prev.map((r) => (r._id === editRouteModal._id ? res.data : r)));
      setEditRouteModal(null);
      alert('✓ Route details & pricing updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update route');
    } finally {
      setSavingRoute(false);
    }
  };

  // ── Delete Route ──────────────────────────────────────────
  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this scheduled route?')) return;
    try {
      await api.delete(`/buses/routes/${routeId}`);
      setRoutes((prev) => prev.filter((r) => r._id !== routeId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete route');
    }
  };

  // ── Bus Creation ──────────────────────────────────────────
  const handleAddBus = async (e) => {
    e.preventDefault();
    setCreatingBus(true);
    try {
      const res = await api.post('/buses', {
        ...busForm,
        totalSeats: Number(busForm.totalSeats) || 32,
        rating: Number(busForm.rating) || 4.5,
      });
      setBuses((prev) => [res.data, ...prev]);
      setBusForm({ busName: '', busNumber: '', type: 'Volvo Multi-axle', totalSeats: 40, rating: 4.8 });
      alert('✓ New bus fleet added successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add bus');
    } finally {
      setCreatingBus(false);
    }
  };

  // ── Bus Edit ──────────────────────────────────────────────
  const handleSaveEditBus = async (e) => {
    e.preventDefault();
    if (!editBusModal) return;
    setSavingBus(true);
    try {
      const res = await api.put(`/buses/${editBusModal._id}`, {
        busName: editBusModal.busName,
        busNumber: editBusModal.busNumber,
        type: editBusModal.type,
        totalSeats: Number(editBusModal.totalSeats),
        rating: Number(editBusModal.rating),
      });
      setBuses((prev) => prev.map((b) => (b._id === editBusModal._id ? res.data : b)));
      setEditBusModal(null);
      alert('✓ Bus details updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update bus');
    } finally {
      setSavingBus(false);
    }
  };

  // ── Bus Delete ────────────────────────────────────────────
  const handleDeleteBus = async (busId) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;
    try {
      await api.delete(`/buses/${busId}`);
      setBuses((prev) => prev.filter((b) => b._id !== busId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete bus');
    }
  };

  // Live fare preview for the create route form
  const previewAisleFare = Number(routeForm.fare) || 0;
  const previewWindowFare = getSeatFare(previewAisleFare, 1, pricingConfig);

  return (
    <section className="section admin-section">
      <div className="section-head">
        <div>
          <div className="section-eyebrow">Control Center</div>
          <div className="section-title">Admin Management Dashboard</div>
        </div>
      </div>

      {/* Top Level Metric KPIs */}
      <div className="admin-stats-grid">
        <div className="glass-card admin-stat-card">
          <div className="stat-icon">🗺️</div>
          <div className="stat-value">{stats.totalRoutes}</div>
          <div className="stat-label">Scheduled Trips</div>
        </div>
        <div className="glass-card admin-stat-card">
          <div className="stat-icon">🚍</div>
          <div className="stat-value">{stats.totalBuses}</div>
          <div className="stat-label">Fleet Buses</div>
        </div>
        <div className="glass-card admin-stat-card">
          <div className="stat-icon">🎟️</div>
          <div className="stat-value">{stats.confirmedCount}</div>
          <div className="stat-label">Confirmed Bookings</div>
        </div>
        <div className="glass-card admin-stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
          <div className="stat-label">Gross Revenue (GST Incl.)</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs" style={{ marginTop: '28px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`tab-btn ${tab === 'routes' ? 'active' : ''}`}
          onClick={() => setTab('routes')}
        >
          🗺️ Routes &amp; Pricing ({routes.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'buses' ? 'active' : ''}`}
          onClick={() => setTab('buses')}
        >
          🚍 Fleet Buses ({buses.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'bookings' ? 'active' : ''}`}
          onClick={() => setTab('bookings')}
        >
          🎟️ Passenger Bookings ({bookings.length})
        </button>
      </div>

      {loading && <div className="center-msg">Loading CityLink management system...</div>}

      {/* ══════════════════════════════════════════════════════
          TAB 1: ROUTES & DYNAMIC PRICING MANAGEMENT
         ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'routes' && (
        <>
          {/* Frontend Dynamic Pricing Configuration Engine */}
          <div className="glass-card seat-panel dynamic-pricing-engine-card" style={{ marginBottom: '24px' }}>
            <div className="engine-header">
              <div className="seat-panel-title" style={{ fontSize: '1.15rem' }}>
                ⚡ Frontend Dynamic Pricing Engine
              </div>
              <div className="seat-panel-sub">
                Configure live Window Seat surcharge rules applied across the whole frontend without needing backend code changes.
              </div>
            </div>

            {configToast && (
              <div className="pricing-toast-banner">
                {configToast}
              </div>
            )}

            <div className="pricing-controls-grid">
              <div className="pricing-control-group">
                <label className="pricing-control-label">Surcharge Mode</label>
                <div className="mode-toggle-group">
                  <button
                    type="button"
                    className={`mode-btn ${pricingConfig.pricingMode === 'percentage' ? 'active' : ''}`}
                    onClick={() => handleApplyPricingConfig({ ...pricingConfig, pricingMode: 'percentage' })}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${pricingConfig.pricingMode === 'flat' ? 'active' : ''}`}
                    onClick={() => handleApplyPricingConfig({ ...pricingConfig, pricingMode: 'flat' })}
                  >
                    Flat INR (₹)
                  </button>
                </div>
              </div>

              {pricingConfig.pricingMode === 'percentage' ? (
                <div className="pricing-control-group">
                  <label className="pricing-control-label">Window Premium Rate (%)</label>
                  <div className="preset-pill-group">
                    {[10, 12, 15, 20, 25].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className={`preset-pill ${Number(pricingConfig.windowPremiumPercent) === pct ? 'active' : ''}`}
                        onClick={() => handleApplyPricingConfig({ ...pricingConfig, windowPremiumPercent: pct })}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pricing-control-group">
                  <label className="pricing-control-label">Flat Window Surcharge (₹)</label>
                  <div className="preset-pill-group">
                    {[40, 50, 60, 80, 100].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={`preset-pill ${Number(pricingConfig.flatSurcharge) === amt ? 'active' : ''}`}
                        onClick={() => handleApplyPricingConfig({ ...pricingConfig, flatSurcharge: amt })}
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pricing-control-group">
                <label className="pricing-control-label">Live Calculation Preview</label>
                <div className="live-preview-chip-box">
                  <span className="sample-calc">
                    ₹500 Trip ➔ Aisle: <strong>₹500</strong> | Window: <strong>₹{getSeatFare(500, 1, pricingConfig)}</strong>
                  </span>
                  <span className="sample-calc">
                    ₹1000 Trip ➔ Aisle: <strong>₹1000</strong> | Window: <strong>₹{getSeatFare(1000, 1, pricingConfig)}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Add Route Form */}
          <form className="glass-card seat-panel form-grid" onSubmit={handleAddRoute} style={{ marginBottom: '26px' }}>
            <div className="form-header-row" style={{ gridColumn: '1 / -1', marginBottom: '8px' }}>
              <div className="seat-panel-title" style={{ fontSize: '1.15rem' }}>Add New Route &amp; Set Base Fare</div>
              <div className="seat-panel-sub">Assign bus schedules and define base prices directly from the frontend</div>
            </div>

            <div className="auth-field">
              <label>Assigned Bus</label>
              <select
                value={routeForm.bus}
                onChange={(e) => setRouteForm({ ...routeForm, bus: e.target.value })}
                required
              >
                <option value="">Select bus from fleet...</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.busName} ({b.busNumber}) - {b.type} ({b.totalSeats} seats)
                  </option>
                ))}
              </select>
            </div>

            <div className="auth-field">
              <label>Origin (Source City)</label>
              <input
                placeholder="e.g. Kolkata"
                value={routeForm.source}
                onChange={(e) => setRouteForm({ ...routeForm, source: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Destination City</label>
              <input
                placeholder="e.g. Digha"
                value={routeForm.destination}
                onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Departure Date &amp; Time</label>
              <input
                type="datetime-local"
                value={routeForm.departureTime}
                onChange={(e) => setRouteForm({ ...routeForm, departureTime: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Estimated Duration</label>
              <input
                placeholder="e.g. 4h 15m"
                value={routeForm.duration}
                onChange={(e) => setRouteForm({ ...routeForm, duration: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Base Price / Aisle Fare (₹)</label>
              <input
                type="number"
                min="100"
                step="10"
                placeholder="e.g. 450"
                value={routeForm.fare}
                onChange={(e) => setRouteForm({ ...routeForm, fare: e.target.value })}
                required
              />
            </div>

            {/* Live Pricing Preview Box */}
            <div className="admin-price-preview-banner" style={{ gridColumn: '1 / -1' }}>
              <div className="preview-label">⚡ Live Pricing Output for this Route:</div>
              <div className="preview-items">
                <span className="admin-badge-aisle">🚶 Aisle / Standard Seat: <strong>₹{previewAisleFare}</strong></span>
                <span className="admin-badge-window">🪟 Window Seat (Premium): <strong>₹{previewWindowFare}</strong></span>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={creatingRoute} style={{ gridColumn: '1 / -1' }}>
              {creatingRoute ? 'Creating Route...' : '+ Add Scheduled Route'}
            </button>
          </form>

          {/* Search & Filter bar for routes */}
          <div className="admin-controls-bar">
            <div className="admin-search-wrap">
              <input
                type="text"
                className="admin-search-input"
                placeholder="🔍 Search routes by origin, destination, bus name, or fare..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="admin-clear-btn" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>
            <div className="admin-count-tag">
              Showing <strong>{filteredRoutes.length}</strong> of {routes.length} trips
            </div>
          </div>

          {/* Routes Table */}
          <div className="glass-card table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Route (Origin → Destination)</th>
                  <th>Assigned Bus</th>
                  <th>Departure Date &amp; Time</th>
                  <th>Duration</th>
                  <th style={{ minWidth: '220px' }}>Dynamic Fare (Aisle / Window)</th>
                  <th style={{ textAlign: 'right', minWidth: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((r) => {
                  const aisleFare = getSeatFare(r.fare, 2, pricingConfig);
                  const windowFare = getSeatFare(r.fare, 1, pricingConfig);
                  const isEditingPrice = editingPriceId === r._id;
                  const dateStr = r.departureTime
                    ? new Date(r.departureTime).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'N/A';

                  return (
                    <tr key={r._id}>
                      <td>
                        <strong>{r.source}</strong> → <strong>{r.destination}</strong>
                      </td>
                      <td>
                        <div>{r.bus?.busName || 'CityLink Liner'}</div>
                        <span className="table-sub-text">{r.bus?.busNumber} · {r.bus?.type}</span>
                      </td>
                      <td>{dateStr}</td>
                      <td>{r.duration}</td>
                      <td>
                        {isEditingPrice ? (
                          <div className="inline-price-edit-box">
                            <input
                              type="number"
                              min="50"
                              step="10"
                              className="inline-price-input"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlinePrice(r._id);
                                if (e.key === 'Escape') cancelInlinePriceEdit();
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn-save-sm"
                              onClick={() => saveInlinePrice(r._id)}
                              disabled={savingPrice}
                              title="Save new fare"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="btn-cancel-sm"
                              onClick={cancelInlinePriceEdit}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="admin-fare-badge-group">
                            <span className="admin-badge-aisle" title="Standard Aisle Seat Fare">
                              Aisle: ₹{aisleFare}
                            </span>
                            <span className="admin-badge-window" title="Premium Window Seat Fare">
                              Window: ₹{windowFare}
                            </span>
                            <button
                              type="button"
                              className="btn-quick-edit-price"
                              onClick={() => startInlinePriceEdit(r)}
                              title="Click to quickly change price dynamically"
                            >
                              ✎ Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={() => {
                              const d = r.departureTime ? new Date(r.departureTime).toISOString().slice(0, 16) : '';
                              const routeBusId = r.bus?._id || '';
                              // Ensure the stored bus still exists in the fleet; fall back to first available
                              const validBusId = buses.some((b) => b._id === routeBusId)
                                ? routeBusId
                                : (buses[0]?._id || '');
                              setEditRouteModal({
                                _id: r._id,
                                bus: validBusId,
                                source: r.source,
                                destination: r.destination,
                                departureTime: d,
                                duration: r.duration,
                                fare: r.fare,
                              });
                            }}
                            title="Edit full route details"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => handleDeleteRoute(r._id)}
                            title="Delete route"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: FLEET BUSES MANAGEMENT
         ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'buses' && (
        <>
          <form className="glass-card seat-panel form-grid" onSubmit={handleAddBus} style={{ marginBottom: '26px' }}>
            <div className="form-header-row" style={{ gridColumn: '1 / -1', marginBottom: '8px' }}>
              <div className="seat-panel-title" style={{ fontSize: '1.15rem' }}>Add Bus to CityLink Fleet</div>
              <div className="seat-panel-sub">Register vehicle details, coach type, and seat capacity</div>
            </div>

            <div className="auth-field">
              <label>Bus / Operator Name</label>
              <input
                placeholder="e.g. CityLink Royal Goldliner"
                value={busForm.busName}
                onChange={(e) => setBusForm({ ...busForm, busName: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Registration Number</label>
              <input
                placeholder="e.g. CL-DL-01-AX-9999"
                value={busForm.busNumber}
                onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Coach Type</label>
              <select
                value={busForm.type}
                onChange={(e) => setBusForm({ ...busForm, type: e.target.value })}
              >
                <option value="Volvo Multi-axle">Volvo Multi-axle</option>
                <option value="AC Sleeper">AC Sleeper</option>
                <option value="AC Seater">AC Seater</option>
                <option value="Non-AC Seater">Non-AC Seater</option>
              </select>
            </div>

            <div className="auth-field">
              <label>Seat Capacity</label>
              <select
                value={busForm.totalSeats}
                onChange={(e) => setBusForm({ ...busForm, totalSeats: Number(e.target.value) })}
              >
                <option value={32}>32 Seats (Luxury Sleeper)</option>
                <option value={36}>36 Seats (AC Express)</option>
                <option value={40}>40 Seats (Multi-Axle)</option>
                <option value={44}>44 Seats (High Capacity)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" disabled={creatingBus} style={{ gridColumn: '1 / -1' }}>
              {creatingBus ? 'Registering Bus...' : '+ Register Fleet Bus'}
            </button>
          </form>

          <div className="glass-card table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Bus Name</th>
                  <th>Vehicle Number</th>
                  <th>Coach Class</th>
                  <th>Seats</th>
                  <th>Rating</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((b) => (
                  <tr key={b._id}>
                    <td><strong>{b.busName}</strong></td>
                    <td><span className="booking-ref-chip">{b.busNumber}</span></td>
                    <td>{b.type}</td>
                    <td>{b.totalSeats} seats</td>
                    <td>★ {b.rating || '4.5'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => setEditBusModal({ ...b })}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => handleDeleteBus(b._id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: ALL PASSENGER BOOKINGS
         ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'bookings' && (
        <div className="glass-card table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Passenger Name &amp; Contact</th>
                <th>Route</th>
                <th>Seats</th>
                <th>Total Fare</th>
                <th>Status</th>
                <th>Booking Date</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const dateStr = b.createdAt
                  ? new Date(b.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A';

                return (
                  <tr key={b._id}>
                    <td>
                      <span className="booking-ref-chip">CL-{b._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td>
                      <strong>{b.passengerName || b.user?.name || 'Passenger'}</strong>
                      <div className="table-sub-text">{b.passengerPhone || b.user?.email}</div>
                    </td>
                    <td>
                      <strong>{b.route?.source || 'N/A'}</strong> → <strong>{b.route?.destination || 'N/A'}</strong>
                      <div className="table-sub-text">{b.route?.bus?.busName}</div>
                    </td>
                    <td>
                      <span className="table-seats-badge">
                        {Array.isArray(b.seats) ? b.seats.join(', ') : 'N/A'}
                        {b.isCouple ? ' (Couple)' : ''}
                      </span>
                    </td>
                    <td><strong>₹{b.totalFare}</strong></td>
                    <td>
                      <span className={`status-pill status-${b.status}`}>{b.status}</span>
                    </td>
                    <td>{dateStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL: EDIT ROUTE & DYNAMIC FARES
         ══════════════════════════════════════════════════════ */}
      {editRouteModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setEditRouteModal(null); }}>
          <div className="glass-card confirm-modal admin-edit-modal">
            <button className="modal-close" onClick={() => setEditRouteModal(null)}>✕</button>
            <div className="modal-title" style={{ fontSize: '1.25rem' }}>Edit Route &amp; Price</div>
            <div className="modal-subtitle">Modify schedule, origin/destination, and dynamic fare values</div>

            <form onSubmit={handleSaveEditRoute} style={{ marginTop: '16px' }}>
              <div className="auth-field">
                <label>Assigned Bus</label>
                <select
                  value={editRouteModal.bus}
                  onChange={(e) => setEditRouteModal({ ...editRouteModal, bus: e.target.value })}
                  required
                >
                  {buses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.busName} ({b.busNumber}) - {b.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="auth-field">
                  <label>Origin</label>
                  <input
                    value={editRouteModal.source}
                    onChange={(e) => setEditRouteModal({ ...editRouteModal, source: e.target.value })}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label>Destination</label>
                  <input
                    value={editRouteModal.destination}
                    onChange={(e) => setEditRouteModal({ ...editRouteModal, destination: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="auth-field">
                  <label>Departure Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={editRouteModal.departureTime}
                    onChange={(e) => setEditRouteModal({ ...editRouteModal, departureTime: e.target.value })}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label>Duration</label>
                  <input
                    value={editRouteModal.duration}
                    onChange={(e) => setEditRouteModal({ ...editRouteModal, duration: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Base Fare / Aisle Price (₹)</label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={editRouteModal.fare}
                  onChange={(e) => setEditRouteModal({ ...editRouteModal, fare: e.target.value })}
                  required
                />
              </div>

              {/* Dynamic Price Preview in Modal */}
              <div className="admin-price-preview-banner" style={{ margin: '12px 0 20px 0' }}>
                <div className="preview-label">Dynamic Prices Applied:</div>
                <div className="preview-items">
                  <span className="admin-badge-aisle">🚶 Aisle: ₹{editRouteModal.fare}</span>
                  <span className="admin-badge-window">🪟 Window: ₹{getSeatFare(editRouteModal.fare, 1, pricingConfig)}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={savingRoute}>
                  {savingRoute ? 'Saving Changes...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditRouteModal(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL: EDIT BUS FLEET
         ══════════════════════════════════════════════════════ */}
      {editBusModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setEditBusModal(null); }}>
          <div className="glass-card confirm-modal admin-edit-modal">
            <button className="modal-close" onClick={() => setEditBusModal(null)}>✕</button>
            <div className="modal-title" style={{ fontSize: '1.25rem' }}>Edit Fleet Bus</div>
            <div className="modal-subtitle">Update bus name, registration number, or seat layout</div>

            <form onSubmit={handleSaveEditBus} style={{ marginTop: '16px' }}>
              <div className="auth-field">
                <label>Bus Name</label>
                <input
                  value={editBusModal.busName}
                  onChange={(e) => setEditBusModal({ ...editBusModal, busName: e.target.value })}
                  required
                />
              </div>

              <div className="auth-field">
                <label>Vehicle Number</label>
                <input
                  value={editBusModal.busNumber}
                  onChange={(e) => setEditBusModal({ ...editBusModal, busNumber: e.target.value })}
                  required
                />
              </div>

              <div className="auth-field">
                <label>Coach Type</label>
                <select
                  value={editBusModal.type}
                  onChange={(e) => setEditBusModal({ ...editBusModal, type: e.target.value })}
                >
                  <option value="Volvo Multi-axle">Volvo Multi-axle</option>
                  <option value="AC Sleeper">AC Sleeper</option>
                  <option value="AC Seater">AC Seater</option>
                  <option value="Non-AC Seater">Non-AC Seater</option>
                </select>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="auth-field">
                  <label>Total Seats</label>
                  <input
                    type="number"
                    value={editBusModal.totalSeats}
                    onChange={(e) => setEditBusModal({ ...editBusModal, totalSeats: e.target.value })}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label>Rating (1 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editBusModal.rating}
                    onChange={(e) => setEditBusModal({ ...editBusModal, rating: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="submit" className="btn-primary" disabled={savingBus}>
                  {savingBus ? 'Saving...' : 'Save Bus Details'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditBusModal(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
