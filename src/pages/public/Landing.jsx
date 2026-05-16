import { Link } from 'react-router-dom';
import {
  Bus, MapPin, Clock, Shield, CreditCard,
  Smartphone, Star, ArrowRight, Search, CalendarDays
} from 'lucide-react';
import { useState } from 'react';
import './Landing.css';

export default function Landing() {
  const [searchDate, setSearchDate] = useState('');
  const [searchRoute, setSearchRoute] = useState('roxas_to_manila');

  return (
    <div className="landing">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__gradient"></div>
          <div className="hero__pattern"></div>
          {/* Animated bus */}
          <div className="hero__bus-animation">
            <Bus size={32} className="hero__bus-icon" />
          </div>
        </div>

        <div className="hero__content animate-fade-in-up">
          <div className="hero__badge">
            <Bus size={14} />
            <span>Roxas City ↔ Manila</span>
          </div>
          <h1 className="hero__title">
            Travel made <span className="hero__highlight">simple</span>,
            <br />booking made <span className="hero__highlight">instant</span>
          </h1>
          <p className="hero__subtitle">
            Book your bus trip between Roxas City, Capiz and Manila in just a few clicks.
            Check schedules, pick your seat, and get your e-ticket — all online.
          </p>

          {/* Search Box */}
          <div className="hero__search animate-fade-in-up delay-200">
            <div className="hero__search-field">
              <MapPin size={18} className="hero__search-icon" />
              <select
                value={searchRoute}
                onChange={(e) => setSearchRoute(e.target.value)}
                className="hero__search-select"
              >
                <option value="roxas_to_manila">Roxas City → Manila</option>
                <option value="manila_to_roxas">Manila → Roxas City</option>
              </select>
            </div>
            <div className="hero__search-divider"></div>
            <div className="hero__search-field">
              <CalendarDays size={18} className="hero__search-icon" />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="hero__search-input"
                placeholder="Travel date"
              />
            </div>
            <Link
              to={`/schedules?route=${searchRoute}&date=${searchDate}`}
              className="hero__search-btn"
            >
              <Search size={18} />
              <span>Search Trips</span>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="hero__stats animate-fade-in-up delay-300">
            <div className="hero__stat">
              <strong>500+</strong>
              <span>Happy Passengers</span>
            </div>
            <div className="hero__stat-divider"></div>
            <div className="hero__stat">
              <strong>10+</strong>
              <span>Daily Trips</span>
            </div>
            <div className="hero__stat-divider"></div>
            <div className="hero__stat">
              <strong>4.8</strong>
              <span>
                <Star size={12} fill="var(--accent)" stroke="var(--accent)" /> Rating
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────── */}
      <section className="features">
        <div className="features__container">
          <div className="features__header">
            <span className="section-tag">Why Ro-Route?</span>
            <h2>Everything you need for a <span className="text-gradient">smooth journey</span></h2>
            <p>From booking to boarding, we've got every step covered.</p>
          </div>

          <div className="features__grid">
            {[
              {
                icon: Smartphone,
                title: 'Book Online Anytime',
                desc: 'No more lining up at the terminal. Book your ticket 24/7 from your phone or computer.',
                color: 'var(--primary)'
              },
              {
                icon: MapPin,
                title: 'Choose Your Seat',
                desc: 'Interactive seat map lets you pick exactly where you want to sit on the bus.',
                color: 'var(--driver)'
              },
              {
                icon: CreditCard,
                title: 'Flexible Payment',
                desc: 'Pay via GCash, Maya, or reserve online and pay cash at the terminal counter.',
                color: 'var(--accent)'
              },
              {
                icon: Clock,
                title: 'Real-Time Updates',
                desc: 'Get live trip status updates — know exactly when your bus departs and arrives.',
                color: '#8B5CF6'
              },
              {
                icon: Shield,
                title: 'Secure & Reliable',
                desc: 'Your personal data and payments are protected with modern security standards.',
                color: '#EC4899'
              },
              {
                icon: Star,
                title: 'E-Ticket & QR Code',
                desc: 'Receive a digital ticket with QR code — just show your phone when boarding.',
                color: '#14B8A6'
              }
            ].map((feature, i) => (
              <div key={i} className="feature-card animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="feature-card__icon" style={{ background: `${feature.color}15`, color: feature.color }}>
                  <feature.icon size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="how-it-works">
        <div className="how-it-works__container">
          <div className="features__header">
            <span className="section-tag">How It Works</span>
            <h2>Book your trip in <span className="text-gradient">3 easy steps</span></h2>
          </div>

          <div className="steps">
            {[
              { step: '01', title: 'Search', desc: 'Pick your route and travel date' },
              { step: '02', title: 'Select & Book', desc: 'Choose your schedule, pick a seat, and pay' },
              { step: '03', title: 'Travel', desc: 'Show your e-ticket QR code and board the bus' }
            ].map((s, i) => (
              <div key={i} className="step-card animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="step-card__number">{s.step}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < 2 && <ArrowRight size={20} className="step-card__arrow" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────── */}
      <section className="cta">
        <div className="cta__container animate-fade-in-up">
          <div className="cta__content">
            <h2>Ready to travel?</h2>
            <p>Create your free account and book your first trip today.</p>
            <div className="cta__buttons">
              <Link to="/register" className="btn btn--primary btn--lg">
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <Link to="/schedules" className="btn btn--ghost btn--lg">
                Browse Schedules
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
