import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BusCard from '../components/BusCard';
import SeatMap from '../components/SeatMap';
import BookingForm from '../components/BookingForm';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSeatPosition } from '../utils/seatPricing';

/* ── Booking Confirmation Modal with Animated SVG Checkmark ───────── */
function BookingConfirmModal({ booking, onClose, onDownload, downloadState, onViewBookings }) {
  // Close on backdrop click
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  if (!booking) return null;

  const dateStr = booking.departureTime
    ? new Date(booking.departureTime).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      })
    : 'N/A';

  return (
    <div className="modal-backdrop" onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className="glass-card confirm-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Animated SVG Checkmark Drawing In */}
        <div className="modal-success-anim-wrap">
          <svg className="modal-checkmark-svg" viewBox="0 0 52 52" aria-hidden="true">
            <circle className="checkmark-circle" cx="26" cy="26" r="24" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <div className="modal-title">Booking Confirmed!</div>
        <div className="modal-subtitle">
          Your seats are securely locked in CityLink system.
        </div>

        <div className="modal-details">
          <div className="modal-detail-row">
            <span className="modal-detail-label">Route</span>
            <span className="modal-detail-value">{booking.source} → {booking.destination}</span>
          </div>
          <div className="modal-detail-row">
            <span className="modal-detail-label">Departure</span>
            <span className="modal-detail-value">{dateStr}</span>
          </div>
          <div className="modal-detail-row">
            <span className="modal-detail-label">Passenger(s)</span>
            <span className="modal-detail-value">{booking.passengerName}</span>
          </div>
          <div className="modal-detail-row">
            <span className="modal-detail-label">Seats</span>
            <span className="modal-detail-value highlight-seats">
              {booking.seats.map(s => `Seat ${s} (${getSeatPosition(s).type})`).join(', ')} {booking.isCouple ? '(Couple Pass)' : ''}
            </span>
          </div>
          <div className="modal-detail-row">
            <span className="modal-detail-label">Total Fare (GST incl.)</span>
            <span className="modal-detail-value highlight">₹{booking.totalFare}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className={`btn-primary btn-download ${downloadState === 'loading' ? 'btn-download-loading' : ''} ${downloadState === 'success' ? 'btn-download-success' : ''}`}
            onClick={onDownload}
            disabled={downloadState === 'loading'}
          >
            {downloadState === 'loading' && (
              <>
                <span className="btn-spinner" /> Generating...
              </>
            )}
            {downloadState === 'success' && (
              <>
                <span className="btn-check-icon">✓</span> Downloaded
              </>
            )}
            {downloadState === 'idle' && (
              <>
                <span>⬇</span> Download Ticket
              </>
            )}
          </button>
          <button type="button" className="btn-secondary" onClick={onViewBookings}>
            My Bookings
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main SearchResults Component ───────────────────────── */
export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmData, setConfirmData] = useState(null);   // holds modal data
  const [lastBookingId, setLastBookingId] = useState(null);
  const [downloadState, setDownloadState] = useState('idle'); // 'idle' | 'loading' | 'success'
  const { user } = useAuth();
  const navigate = useNavigate();

  const source = searchParams.get('source');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (source) params.source = source;
    if (destination) params.destination = destination;
    if (date) params.date = date;

    api
      .get('/buses/routes/search', { params })
      .then((res) => setRoutes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false));
  }, [source, destination, date]);

  const handleToggle = async (routeId) => {
    if (expandedId === routeId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(routeId);
    setSelectedSeats([]);
    try {
      const { data } = await api.get(`/bookings/route/${routeId}/booked-seats`);
      setBookedSeats(data.bookedSeats || []);
    } catch (err) {
      setBookedSeats([]);
    }
  };

  const handleBookingSubmit = async (routeId, fare, formData) => {
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        routeId,
        seats: formData.seats,
        passengerName: formData.passengerName,
        passengerPhone: formData.passengerPhone,
        totalFare: formData.totalFare,
        isCouple: formData.isCouple,
        passengers: formData.passengers,
      });

      // 1. Immediately update booked seats state optimistically
      setBookedSeats((prev) => Array.from(new Set([...prev, ...formData.seats])));
      // 2. Clear selected seats in state
      setSelectedSeats([]);

      // 3. Re-fetch route booked seats from backend to reconcile state
      api.get(`/bookings/route/${routeId}/booked-seats`)
        .then((fetchRes) => {
          if (fetchRes.data?.bookedSeats) {
            setBookedSeats(fetchRes.data.bookedSeats);
          }
        })
        .catch(() => {});

      // Find the route details to populate the modal
      const route = routes.find(r => r._id === routeId);
      const bId = res.data._id || res.data.booking?._id || null;
      setLastBookingId(bId);
      setDownloadState('idle');
      setConfirmData({
        source: route?.source || source,
        destination: route?.destination || destination,
        departureTime: route?.departureTime || null,
        passengerName: formData.passengerName,
        seats: formData.seats,
        totalFare: formData.totalFare,
        isCouple: formData.isCouple,
        bookingId: bId,
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!lastBookingId || downloadState === 'loading') return;
    setDownloadState('loading');
    try {
      const res = await api.get(`/bookings/${lastBookingId}/ticket`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CityLink-Ticket-${lastBookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setDownloadState('success');
      setTimeout(() => setDownloadState('idle'), 2200);
    } catch (err) {
      alert('Failed to download ticket');
      setDownloadState('idle');
    }
  };

  const handleViewBookings = () => {
    setConfirmData(null);
    navigate('/my-bookings');
  };

  return (
    <>
      {confirmData && (
        <BookingConfirmModal
          booking={confirmData}
          onClose={() => setConfirmData(null)}
          onDownload={handleDownloadTicket}
          downloadState={downloadState}
          onViewBookings={handleViewBookings}
        />
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-eyebrow">
              {source && destination ? `${source} → ${destination}` : 'Available Trips'}
            </div>
            <div className="section-title">
              {routes.length} bus{routes.length !== 1 ? 'es' : ''} available
            </div>
          </div>
        </div>

        {loading && <div className="center-msg">Searching CityLink network...</div>}
        {!loading && routes.length === 0 && (
          <div className="center-msg">
            No buses found for this route or date. Try selecting another city pair or leaving the date blank.
          </div>
        )}

        <div className="grid-cards">
          {routes.map((route) => (
            <div key={route._id} style={{ gridColumn: expandedId === route._id ? '1 / -1' : 'auto' }}>
              <BusCard route={route} expanded={expandedId === route._id} onToggle={handleToggle} />
              {expandedId === route._id && (
                <div className="form-grid" style={{ marginTop: '16px' }}>
                  <SeatMap
                    totalSeats={route.bus?.totalSeats || 32}
                    bookedSeats={bookedSeats}
                    selectedSeats={selectedSeats}
                    farePerSeat={route.fare}
                    onChange={setSelectedSeats}
                  />
                  <BookingForm
                    selectedSeats={selectedSeats}
                    farePerSeat={route.fare}
                    loading={submitting}
                    onSubmit={(formData) => handleBookingSubmit(route._id, route.fare, formData)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
