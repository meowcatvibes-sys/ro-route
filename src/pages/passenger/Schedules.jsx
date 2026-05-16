import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { schedulesAPI } from '../../services/api';
import {
  Bus, MapPin, Clock, Calendar, Filter,
  Armchair, Snowflake, Sun, ArrowRight
} from 'lucide-react';
import './Schedules.css';

export default function Schedules() {
  const [searchParams] = useSearchParams();
  const [route, setRoute] = useState(searchParams.get('route') || 'all');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [busType, setBusType] = useState('all');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, [route, date, busType]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = {};
      if (route !== 'all') params.route = route;
      if (date) params.date = date;
      if (busType !== 'all') params.bus_type = busType;
      const res = await schedulesAPI.list(params);
      setSchedules(res.data.schedules);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <div className="schedules-page">
      <div className="schedules-page__header animate-fade-in-up">
        <h1>Bus Schedules</h1>
        <p>Find and book your trip between Roxas City and Manila</p>
      </div>

      <div className="schedules-filters animate-fade-in-up delay-100">
        <div className="filter-group">
          <label><MapPin size={14} /> Route</label>
          <select value={route} onChange={e => setRoute(e.target.value)}>
            <option value="all">All Routes</option>
            <option value="roxas_to_manila">Roxas → Manila</option>
            <option value="manila_to_roxas">Manila → Roxas</option>
          </select>
        </div>
        <div className="filter-group">
          <label><Calendar size={14} /> Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label><Filter size={14} /> Bus Type</label>
          <select value={busType} onChange={e => setBusType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="aircon">Aircon</option>
            <option value="non_aircon">Non-Aircon</option>
          </select>
        </div>
      </div>

      <div className="schedules-results">
        {loading ? (
          <div className="page-loader">
            <div className="spinner spinner--lg"></div>
            <p>Loading schedules...</p>
          </div>
        ) : (
          <>
            <p className="schedules-count">{schedules.length} trip{schedules.length !== 1 ? 's' : ''} found</p>
            {schedules.length === 0 ? (
              <div className="schedules-empty animate-fade-in">
                <Bus size={48} />
                <h3>No trips found</h3>
                <p>Try adjusting your filters or selecting a different date.</p>
              </div>
            ) : (
              <div className="schedules-list">
                {schedules.map((s, i) => (
                  <div key={s.id} className="schedule-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="schedule-card__top">
                      <div className="schedule-card__route">
                        <span>{s.route === 'roxas_to_manila' ? 'Roxas City' : 'Manila'}</span>
                        <ArrowRight size={16} className="schedule-card__arrow" />
                        <span>{s.route === 'roxas_to_manila' ? 'Manila' : 'Roxas City'}</span>
                      </div>
                      <div className="schedule-card__type-badge">
                        {s.bus_type === 'aircon' ? <Snowflake size={12} /> : <Sun size={12} />}
                        {s.bus_type === 'aircon' ? 'Aircon' : 'Non-Aircon'}
                      </div>
                    </div>

                    <div className="schedule-card__body">
                      <div className="schedule-card__times">
                        <div className="schedule-card__time">
                          <Clock size={14} />
                          <div>
                            <span className="time-label">Departs</span>
                            <span className="time-value">{formatTime(s.departure_time)}</span>
                          </div>
                        </div>
                        <div className="schedule-card__duration">~12 hrs</div>
                        <div className="schedule-card__time">
                          <Clock size={14} />
                          <div>
                            <span className="time-label">Arrives</span>
                            <span className="time-value">{formatTime(s.estimated_arrival)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="schedule-card__info">
                        <div className="schedule-card__detail">
                          <Bus size={14} />
                          <span>{s.bus_name}</span>
                        </div>
                        <div className="schedule-card__detail">
                          <Calendar size={14} />
                          <span>{s.departure_date}</span>
                        </div>
                        <div className={`schedule-card__seats ${s.available_seats <= 5 ? 'low' : ''}`}>
                          <Armchair size={14} />
                          <span>{s.available_seats} seats left</span>
                        </div>
                      </div>
                    </div>

                    <div className="schedule-card__bottom">
                      <div className="schedule-card__fare">
                        <span className="fare-label">Fare</span>
                        <span className="fare-value">₱{parseFloat(s.fare).toLocaleString()}</span>
                      </div>
                      <Link to={`/schedules/${s.id}`} className="btn btn--primary">
                        Select Trip
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
