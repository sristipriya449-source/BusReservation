import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BusCard from '../components/BusCard';
import api from '../services/api';

const INDIAN_CITIES = [
  'Ahmedabad', 'Bangalore', 'Bhopal', 'Bhubaneswar', 'Chandigarh',
  'Chennai', 'Coimbatore', 'Delhi', 'Dehradun', 'Digha',
  'Goa', 'Guwahati', 'Hyderabad', 'Indore', 'Jaipur',
  'Kochi', 'Kolkata', 'Lucknow', 'Manali', 'Mumbai',
  'Mysore', 'Nagpur', 'Nashik', 'Patna', 'Pune',
  'Puri', 'Raipur', 'Ranchi', 'Shimla', 'Surat', 'Vadodara',
  'Varanasi', 'Vijayawada', 'Visakhapatnam',
];

function CityAutocomplete({ label, placeholder, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapRef = useRef(null);

  const suggestions = value.trim().length > 0
    ? INDIAN_CITIES.filter(c => c.toLowerCase().startsWith(value.trim().toLowerCase()))
    : [];

  const showDropdown = open && suggestions.length > 0;

  const selectCity = (city) => {
    onChange(city);
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      selectCity(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="field autocomplete-wrapper" ref={wrapRef}>
      <label>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        required
      />
      {showDropdown && (
        <div className="autocomplete-dropdown" role="listbox">
          {suggestions.map((city, idx) => (
            <div
              key={city}
              role="option"
              aria-selected={highlighted === idx}
              className={`autocomplete-item${highlighted === idx ? ' highlighted' : ''}`}
              onMouseDown={() => selectCity(city)}
              onMouseEnter={() => setHighlighted(idx)}
            >
              {city}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [popularRoutes, setPopularRoutes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/buses/routes/popular')
      .then((res) => setPopularRoutes(res.data))
      .catch(() => setPopularRoutes([]));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${date}`);
  };

  return (
    <>
      <section className="hero">
        <div className="eyebrow">Fast &amp; Reliable Bus Booking</div>
        <h1 className="hero-title">
          Your Journey,<br />
          <span className="hero-title-accent">Simplified.</span>
        </h1>
        <div className="hero-tagline">
          <span className="tagline-quote">"</span>Jisko jana hai woh jake rahega<span className="tagline-quote">"</span>
        </div>
        <p className="hero-sub">
          Search hundreds of verified routes across India, pick your exact seat on a live interactive map,
          and get an instant GST-compliant e-ticket in seconds.
        </p>

        <form className="glass-card search-card" onSubmit={handleSearch}>
          <CityAutocomplete
            label="From"
            placeholder="e.g. Kolkata"
            value={source}
            onChange={setSource}
          />
          <CityAutocomplete
            label="To"
            placeholder="e.g. Digha"
            value={destination}
            onChange={setDestination}
          />
          <div className="field">
            <label>Date of journey</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Search Buses</button>
        </form>
      </section>

      {popularRoutes.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">Trending this week</div>
              <div className="section-title">Popular Routes</div>
            </div>
          </div>
          <div className="grid-cards">
            {popularRoutes.map((route) => (
              <BusCard
                key={route._id}
                route={route}
                onToggle={() => {
                  const d = route.departureTime ? new Date(route.departureTime).toISOString().split('T')[0] : '';
                  navigate(`/search?source=${encodeURIComponent(route.source)}&destination=${encodeURIComponent(route.destination)}&date=${d}`);
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="section why-section">
        <div className="section-head">
          <div>
            <div className="section-eyebrow">Why CityLink</div>
            <div className="section-title">Built for the real journey</div>
          </div>
        </div>
        <div className="features-grid">
          <div className="glass-card feature-card">
            <span className="feature-icon">🪑</span>
            <div className="feature-title">Live Seat Map</div>
            <div className="feature-desc">Pick your exact window, aisle, or couple seats visually — no guessing, no system-assigned seats.</div>
          </div>
          <div className="glass-card feature-card">
            <span className="feature-icon">🔒</span>
            <div className="feature-title">Anti-Double Booking</div>
            <div className="feature-desc">Seats lock with transactional integrity the moment you select them so two passengers never conflict.</div>
          </div>
          <div className="glass-card feature-card">
            <span className="feature-icon">🎟️</span>
            <div className="feature-title">Instant E-Ticket</div>
            <div className="feature-desc">Structured GST invoice PDF ticket generated immediately upon booking confirmation.</div>
          </div>
          <div className="glass-card feature-card">
            <span className="feature-icon">↩️</span>
            <div className="feature-title">Instant Cancellation</div>
            <div className="feature-desc">Effortlessly manage and cancel bookings from your portal with transparent record keeping.</div>
          </div>
        </div>
      </section>
    </>
  );
}
