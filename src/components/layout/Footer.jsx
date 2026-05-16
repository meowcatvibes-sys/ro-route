import { Link } from 'react-router-dom';
import { Bus, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <div className="footer__logo-icon">
                <Bus size={20} />
              </div>
              <div>
                <h3>Ro-Route</h3>
                <p className="footer__subtitle">Roxas–Manila Integrated Travel Portal</p>
              </div>
            </div>
            <p className="footer__desc">
              Your trusted partner for comfortable and reliable bus travel between Roxas City, Capiz and Manila.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer__section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/schedules">Bus Schedules</Link></li>
              <li><Link to="/announcements">Announcements</Link></li>
              <li><Link to="/login">Book a Trip</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__section">
            <h4>Contact Us</h4>
            <ul className="footer__contact">
              <li>
                <MapPin size={16} />
                <span>Roxas City Bus Terminal, Capiz</span>
              </li>
              <li>
                <Phone size={16} />
                <span>+63 912 345 6789</span>
              </li>
              <li>
                <Mail size={16} />
                <span>info@roroute.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} Ro-Route. All rights reserved.</p>
          <p className="footer__capstone">
            A Capstone Research Project
          </p>
        </div>
      </div>
    </footer>
  );
}
