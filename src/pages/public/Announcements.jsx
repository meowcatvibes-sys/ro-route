import { useState, useEffect } from 'react';
import { publicAPI } from '../../services/api';
import { Megaphone, Calendar } from 'lucide-react';
import './Announcements.css';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicAPI.announcements()
      .then(r => setAnnouncements(r.data.announcements))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner spinner--lg"></div><p>Loading...</p></div>;

  return (
    <div className="announcements-page">
      <div className="announcements-page__header animate-fade-in-up">
        <h1>Announcements</h1>
        <p>Latest travel advisories and updates</p>
      </div>

      {announcements.length === 0 ? (
        <div className="announcements-empty animate-fade-in">
          <Megaphone size={48} />
          <h3>No announcements</h3>
          <p>Check back later for updates.</p>
        </div>
      ) : (
        <div className="announcements-list">
          {announcements.map((a, i) => (
            <div key={a.id} className="announcement-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="announcement-card__icon"><Megaphone size={20} /></div>
              <div className="announcement-card__content">
                <h3>{a.title}</h3>
                <p>{a.content}</p>
                <div className="announcement-card__meta">
                  <span><Calendar size={12} /> {new Date(a.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>By {a.author_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
