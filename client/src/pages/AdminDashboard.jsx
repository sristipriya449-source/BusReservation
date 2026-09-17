import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { getSeatFare, getPricingConfig, savePricingConfig } from '../utils/seatPricing';

const toLocalDatetimeInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/* ── Clean SVG Vector Icons (No Emojis) ────────────────────────── */
const Icons = {
  Route: () => (
    <svg className="admin-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  ),
  Bus: () => (
    <svg className="admin-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="15" rx="3" />
      <path d="M3 9h18" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
      <path d="M6 18v3" />
      <path d="M18 18v3" />
    </svg>
  ),
  Ticket: () => (
    <svg className="admin-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
      <path d="M13 5v2" />
      <path d="M13 11v2" />
      <path d="M13 17v2" />
    </svg>
  ),
  Revenue: () => (
    <svg className="admin-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Search: () => (
    <svg className="admin-svg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Edit: () => (
    <svg className="admin-svg-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Trash: () => (
    <svg className="admin-svg-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Check: () => (
    <svg className="admin-svg-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Close: () => (
    <svg className="admin-svg-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Plus: () => (
    <svg className="admin-svg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Sliders: () => (
    <svg className="admin-svg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('routes');
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Floating Toast Notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  // Frontend Dynamic Pricing Engine State
  const [pricingConfig, setPricingConfigState] = useState(getPricingConfig());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [routePage, setRoutePage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [bookingPage, setBookingPage] = useState(1);
  const [bookingSearch, setBookingSearch] = useState('');

  // Inline Price Editing state
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
        showToast(err.response?.data?.message || 'Failed to load admin data', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Apply Dynamic Pricing Rule ────────────────────────────
  const handleApplyPricingConfig = (newConfig) => {
    const updated = savePricingConfig(newConfig);
    setPricingConfigState(updated);
    showToast('Dynamic pricing configuration applied live across the platform.');
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

  // ── Filtered & Paginated Routes ───────────────────────────
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

  const totalRoutePages = Math.max(1, Math.ceil(filteredRoutes.length / pageSize));

  const paginatedRoutes = useMemo(() => {
    const start = (routePage - 1) * pageSize;
    return filteredRoutes.slice(start, start + pageSize);
  }, [filteredRoutes, routePage, pageSize]);

  // Reset to page 1 on search change
  useEffect(() => {
    setRoutePage(1);
  }, [searchQuery, pageSize]);

  // ── Filtered & Paginated Bookings ─────────────────────────
  const filteredBookings = useMemo(() => {
    if (!bookingSearch.trim()) return bookings;
    const q = bookingSearch.toLowerCase().trim();
    return bookings.filter(
      (b) =>
        b._id?.toLowerCase().includes(q) ||
        b.passengerName?.toLowerCase().includes(q) ||
        b.user?.name?.toLowerCase().includes(q) ||
        b.user?.email?.toLowerCase().includes(q) ||
        b.route?.source?.toLowerCase().includes(q) ||
        b.route?.destination?.toLowerCase().includes(q) ||
        b.status?.toLowerCase().includes(q)
    );
  }, [bookings, bookingSearch]);

  const totalBookingPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));

  const paginatedBookings = useMemo(() => {
    const start = (bookingPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, bookingPage, pageSize]);

  useEffect(() => {
    setBookingPage(1);
  }, [bookingSearch, pageSize]);

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
      showToast('Please enter a valid positive fare amount.', 'error');
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
      showToast('Route fare updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update fare', 'error');
    } finally {
      setSavingPrice(false);
    }
  };

  // ── Route Creation ────────────────────────────────────────
  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!routeForm.bus || !routeForm.source || !routeForm.destination || !routeForm.departureTime) {
      showToast('Please complete all required route fields.', 'error');
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
      showToast('New scheduled route created successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add route', 'error');
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
      showToast('Route details and schedule updated.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update route', 'error');
    } finally {
      setSavingRoute(false);
    }
  };

  // ── Delete Route ──────────────────────────────────────────
  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Delete this scheduled route? This action cannot be undone.')) return;
    try {
      await api.delete(`/buses/routes/${routeId}`);
      setRoutes((prev) => prev.filter((r) => r._id !== routeId));
      showToast('Route schedule removed successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete route', 'error');
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
      showToast('New bus registered in fleet.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add bus', 'error');
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
      // Also update matching buses in routes list
      setRoutes((prev) =>
        prev.map((r) => {
          if (r.bus?._id === editBusModal._id || r.bus === editBusModal._id) {
            return { ...r, bus: res.data };
          }
          return r;
        })
      );
      setEditBusModal(null);
      showToast('Bus fleet details updated.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update bus', 'error');
    } finally {
      setSavingBus(false);
    }
  };

  // ── Bus Delete ────────────────────────────────────────────
  const handleDeleteBus = async (busId) => {
    if (!window.confirm('Delete this bus from fleet? Scheduled routes for this bus may be affected.')) return;
    try {
      await api.delete(`/buses/${busId}`);
      setBuses((prev) => prev.filter((b) => b._id !== busId));
      showToast('Bus removed from fleet.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete bus', 'error');
    }
  };

  // Live fare preview calculation for create route form
  const previewAisleFare = Number(routeForm.fare) || 0;
  const previewWindowFare = getSeatFare(previewAisleFare, 1, pricingConfig);

  return (
    <section className="section admin-section">
      {/* Floating Modern Toast Notification */}
      {toast.show && (
        <div className={`admin-floating-toast toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'error' ? <Icons.Close /> : <Icons.Check />}
          </div>
          <div className="toast-text">{toast.message}</div>
          <button
            type="button"
            className="toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
          >
            <Icons.Close />
          </button>
        </div>
      )}

      {/* Control Center Header */}
      <div className="section-head">
        <div>
          <div className="section-eyebrow">Control Center</div>
          <div className="section-title">Admin Management Dashboard</div>
        </div>
      </div>

      {/* Top Level Metric KPIs with Vector Icons */}
      <div className="admin-stats-grid">
        <div className="glass-card admin-stat-card">
          <div className="stat-icon-wrap">
            <Icons.Route />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalRoutes}</div>
            <div className="stat-label">Scheduled Trips</div>
          </div>
        </div>
        <div className="glass-card admin-stat-card">
          <div className="stat-icon-wrap">
            <Icons.Bus />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalBuses}</div>
            <div className="stat-label">Fleet Buses</div>
          </div>
        </div>
        <div className="glass-card admin-stat-card">
          <div className="stat-icon-wrap">
            <Icons.Ticket />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.confirmedCount}</div>
            <div className="stat-label">Confirmed Bookings</div>
          </div>
        </div>
        <div className="glass-card admin-stat-card">
          <div className="stat-icon-wrap">
            <Icons.Revenue />
          </div>
          <div className="stat-content">
            <div className="stat-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
            <div className="stat-label">Gross Revenue (GST Incl.)</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs-bar">
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'routes' ? 'active' : ''}`}
          onClick={() => setTab('routes')}
        >
          <Icons.Route />
          <span>Routes &amp; Pricing ({routes.length})</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'buses' ? 'active' : ''}`}
          onClick={() => setTab('buses')}
        >
          <Icons.Bus />
          <span>Fleet Buses ({buses.length})</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'bookings' ? 'active' : ''}`}
          onClick={() => setTab('bookings')}
        >
          <Icons.Ticket />
          <span>Bookings ({bookings.length})</span>
        </button>
      </div>

      {loading && (
        <div className="glass-card center-msg" style={{ padding: '40px' }}>
          <div className="spinner-center" />
          <div style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading CityLink control center...</div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 1: ROUTES & PRICING MANAGEMENT
         ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'routes' && (
        <>
          {/* Dynamic Pricing Engine Card */}
          <div className="glass-card dynamic-pricing-engine-card">
            <div className="engine-header">
              <div className="engine-title-wrap">
                <Icons.Sliders />
                <div className="seat-panel-title" style={{ fontSize: '1.15rem' }}>
                  Dynamic Pricing Engine
                </div>
              </div>
              <div className="seat-panel-sub">
                Configure live Window Seat premium rules calculated dynamically on the platform.
              </div>
            </div>

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
                    Flat Rate (₹)
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
          <form className="glass-card form-grid" onSubmit={handleAddRoute} style={{ marginBottom: '24px' }}>
            <div className="form-header-row" style={{ gridColumn: '1 / -1', marginBottom: '8px' }}>
              <div className="seat-panel-title" style={{ fontSize: '1.15rem' }}>Add Scheduled Route</div>
              <div className="seat-panel-sub">Assign fleet buses, set origins, destinations, and base fares</div>
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
                placeholder="e.g. Mumbai"
                value={routeForm.source}
                onChange={(e) => setRouteForm({ ...routeForm, source: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Destination City</label>
              <input
                placeholder="e.g. Pune"
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
                placeholder="e.g. 3h 30m"
                value={routeForm.duration}
                onChange={(e) => setRouteForm({ ...routeForm, duration: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Base Fare / Aisle Price (₹)</label>
              <input
                type="number"
                min="50"
                step="10"
                placeholder="e.g. 550"
                value={routeForm.fare}
                onChange={(e) => setRouteForm({ ...routeForm, fare: e.target.value })}
                required
              />
            </div>

            {/* Live Pricing Output Preview */}
            <div className="admin-price-preview-banner" style={{ gridColumn: '1 / -1' }}>
              <div className="preview-label">Applied Seat Pricing for this Route:</div>
              <div className="preview-items">
                <span className="admin-badge-aisle">Aisle Standard: <strong>₹{previewAisleFare}</strong></span>
                <span className="admin-badge-window">Window Premium: <strong>₹{previewWindowFare}</strong></span>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={creatingRoute} style={{ gridColumn: '1 / -1' }}>
              {creatingRoute ? 'Creating Route...' : '+ Add Scheduled Route'}
            </button>
          </form>

          {/* Search & Pagination Control Header */}
          <div className="admin-controls-bar">
            <div className="admin-search-wrap">
              <span className="search-icon-adornment">
                <Icons.Search />
              </span>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search routes by origin, destination, bus name, or fare..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="admin-clear-btn" onClick={() => setSearchQuery('')}>
                  <Icons.Close />
                </button>
              )}
            </div>

            <div className="admin-pagination-selector">
              <span className="admin-count-tag">
                Showing <strong>{filteredRoutes.length > 0 ? (routePage - 1) * pageSize + 1 : 0} - {Math.min(routePage * pageSize, filteredRoutes.length)}</strong> of <strong>{filteredRoutes.length}</strong> trips
              </span>
              <select
                className="admin-page-size-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>

          {/* Routes Table */}
          <div className="glass-card table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Assigned Bus</th>
                  <th>Departure Date &amp; Time</th>
                  <th>Duration</th>
                  <th style={{ minWidth: '220px' }}>Dynamic Fare</th>
                  <th style={{ textAlign: 'right', minWidth: '140px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No routes found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  paginatedRoutes.map((r) => {
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
                                <Icons.Check />
                              </button>
                              <button
                                type="button"
                                className="btn-cancel-sm"
                                onClick={cancelInlinePriceEdit}
                                title="Cancel"
                              >
                                <Icons.Close />
                              </button>
                            </div>
                          ) : (
                            <div className="admin-fare-badge-group">
                              <span className="admin-badge-aisle">
                                Aisle: ₹{aisleFare}
                              </span>
                              <span className="admin-badge-window">
                                Window: ₹{windowFare}
                              </span>
                              <button
                                type="button"
                                className="btn-quick-edit-price"
                                onClick={() => startInlinePriceEdit(r)}
                                title="Quick edit base price"
                              >
                                <Icons.Edit />
                                <span>Edit</span>
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
                                const d = toLocalDatetimeInput(r.departureTime);
                                const routeBusId = r.bus?._id || r.bus || '';
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
                              <Icons.Edit />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="btn-action-delete"
                              onClick={() => handleDeleteRoute(r._id)}
                              title="Delete route"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Navigation Bar */}
          {totalRoutePages > 1 && (
            <div className="admin-pagination-nav">
              <button
                type="button"
                className="btn-page-step"
                disabled={routePage <= 1}
                onClick={() => setRoutePage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>

              <div className="page-numbers-wrap">
                <span className="page-indicator-text">
                  Page <strong>{routePage}</strong> of <strong>{totalRoutePages}</strong>
                </span>
              </div>

              <button
                type="button"
                className="btn-page-step"
                disabled={routePage >= totalRoutePages}
                onClick={() => setRoutePage((p) => Math.min(totalRoutePages, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: FLEET BUSES MANAGEMENT
         ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'buses' && (
        <>
          <form className="glass-card form-grid" onSubmit={handleAddBus} style={{ marginBottom: '24px' }}>
            <div className="form-header-row" style={{ gridColumn: '1 / -1', marginBottom: '8px' }}>
              <div className="seat-panel-title" style={{ fontSize: '1.15rem' }}>Add Bus to Fleet</div>
              <div className="seat-panel-sub">Register vehicle details, coach class, and passenger capacity</div>
            </div>

            <div className="auth-field">
              <label>Bus / Operator Name</label>
              <input
                placeholder="e.g. CityLink Royal Club Class"
                value={busForm.busName}
                onChange={(e) => setBusForm({ ...busForm, busName: e.target.value })}
                required
              />
            </div>

            <div className="auth-field">
              <label>Registration Number</label>
              <input
                placeholder="e.g. CL-KA-01-E-1001"
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
                          <Icons.Edit />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => handleDeleteBus(b._id)}
                        >
                          <Icons.Trash />
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
        <>
          <div className="admin-controls-bar">
            <div className="admin-search-wrap">
              <span className="search-icon-adornment">
                <Icons.Search />
              </span>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search bookings by passenger name, email, booking ref, or route..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
              />
              {bookingSearch && (
                <button type="button" className="admin-clear-btn" onClick={() => setBookingSearch('')}>
                  <Icons.Close />
                </button>
              )}
            </div>

            <div className="admin-pagination-selector">
              <span className="admin-count-tag">
                Showing <strong>{filteredBookings.length > 0 ? (bookingPage - 1) * pageSize + 1 : 0} - {Math.min(bookingPage * pageSize, filteredBookings.length)}</strong> of <strong>{filteredBookings.length}</strong> bookings
              </span>
            </div>
          </div>

          <div className="glass-card table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Passenger &amp; Contact</th>
                  <th>Route</th>
                  <th>Seats</th>
                  <th>Total Fare</th>
                  <th>Status</th>
                  <th>Booking Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((b) => {
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
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalBookingPages > 1 && (
            <div className="admin-pagination-nav">
              <button
                type="button"
                className="btn-page-step"
                disabled={bookingPage <= 1}
                onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>

              <div className="page-numbers-wrap">
                <span className="page-indicator-text">
                  Page <strong>{bookingPage}</strong> of <strong>{totalBookingPages}</strong>
                </span>
              </div>

              <button
                type="button"
                className="btn-page-step"
                disabled={bookingPage >= totalBookingPages}
                onClick={() => setBookingPage((p) => Math.min(totalBookingPages, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL: EDIT ROUTE & DYNAMIC FARES
         ══════════════════════════════════════════════════════ */}
      {editRouteModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditRouteModal(null);
          }}
        >
          <div className="glass-card confirm-modal admin-edit-modal">
            <button
              type="button"
              className="modal-close"
              onClick={() => setEditRouteModal(null)}
              aria-label="Close modal"
            >
              <Icons.Close />
            </button>
            <div className="modal-title" style={{ fontSize: '1.25rem' }}>Edit Scheduled Route</div>
            <div className="modal-subtitle">Modify vehicle assignment, timings, and dynamic base fare</div>

            <form onSubmit={handleSaveEditRoute} style={{ marginTop: '18px' }}>
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
              <div className="admin-price-preview-banner" style={{ margin: '14px 0 20px 0' }}>
                <div className="preview-label">Dynamic Seat Prices:</div>
                <div className="preview-items">
                  <span className="admin-badge-aisle">Aisle: ₹{editRouteModal.fare}</span>
                  <span className="admin-badge-window">Window: ₹{getSeatFare(editRouteModal.fare, 1, pricingConfig)}</span>
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
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditBusModal(null);
          }}
        >
          <div className="glass-card confirm-modal admin-edit-modal">
            <button
              type="button"
              className="modal-close"
              onClick={() => setEditBusModal(null)}
              aria-label="Close modal"
            >
              <Icons.Close />
            </button>
            <div className="modal-title" style={{ fontSize: '1.25rem' }}>Edit Fleet Bus</div>
            <div className="modal-subtitle">Update vehicle name, registration number, or passenger capacity</div>

            <form onSubmit={handleSaveEditBus} style={{ marginTop: '18px' }}>
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
