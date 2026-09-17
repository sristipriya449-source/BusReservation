import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState(null);

  const fetchBookings = useCallback((showLoader = false) => {
    if (showLoader) setLoading(true);
    api
      .get('/bookings/my')
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBookings([]))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    // 1. Optimistically update local booking status to 'cancelled' immediately
    setBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? { ...b, status: 'cancelled' } : b))
    );
    setCancellingId(bookingId);

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      // 2. Reconcile with database quietly without full page loader flash
      fetchBookings(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
      // Re-fetch to restore accurate state on error
      fetchBookings(false);
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownload = async (bookingId) => {
    if (downloadingId) return;
    setDownloadingId(bookingId);
    try {
      const res = await api.get(`/bookings/${bookingId}/ticket`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CityLink-Ticket-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setDownloadingId(null);
      setDownloadSuccessId(bookingId);
      setTimeout(() => {
        setDownloadSuccessId(null);
      }, 2200);
    } catch (err) {
      setDownloadingId(null);
      alert(err.response?.data?.message || 'Failed to download ticket');
    }
  };

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-eyebrow">Your trips</div>
          <div className="section-title">My Bookings</div>
        </div>
      </div>

      {loading && <div className="center-msg">Loading your bookings...</div>}
      {!loading && bookings.length === 0 && (
        <div className="center-msg">You haven't booked any tickets yet.</div>
      )}

      {bookings.length > 0 && (
        <div className="glass-card table-wrap">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Route</th>
                <th>Departure Date</th>
                <th>Seats</th>
                <th>Fare (GST incl.)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const isDownloading = downloadingId === b._id;
                const isDownloaded = downloadSuccessId === b._id;
                const isCancelling = cancellingId === b._id;
                const dateStr = b.route?.departureTime
                  ? new Date(b.route.departureTime).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })
                  : 'N/A';

                return (
                  <tr key={b._id}>
                    <td>
                      <span className="booking-ref-chip">CL-{b._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td>
                      <strong>{b.route?.source || 'N/A'}</strong> → <strong>{b.route?.destination || 'N/A'}</strong>
                      <div className="table-sub-text">{b.route?.bus?.busName}</div>
                    </td>
                    <td>{dateStr}</td>
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
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className={`btn-outline btn-ticket ${isDownloading ? 'btn-ticket-loading' : ''} ${isDownloaded ? 'btn-ticket-success' : ''}`}
                          onClick={() => handleDownload(b._id)}
                          disabled={isDownloading}
                          aria-label="Download e-ticket PDF"
                        >
                          {isDownloading ? (
                            <>
                              <span className="btn-spinner-sm" /> Generating...
                            </>
                          ) : isDownloaded ? (
                            <>
                              <span className="btn-check-sm">✓</span> Downloaded
                            </>
                          ) : (
                            <>
                              <span>⬇</span> Ticket
                            </>
                          )}
                        </button>
                        {b.status === 'confirmed' && (
                          <button
                            type="button"
                            className="btn-outline btn-cancel"
                            onClick={() => handleCancel(b._id)}
                            disabled={isCancelling}
                          >
                            {isCancelling ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
