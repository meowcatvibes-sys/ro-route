import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function ComingSoon() {
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).pop();
  const formatted = pageName
    ? pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ')
    : 'This page';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      textAlign: 'center',
      padding: '2rem',
      gap: '1rem',
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: 'var(--primary-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--primary)',
        marginBottom: '0.5rem',
      }}>
        <Construction size={36} />
      </div>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--text-heading)' }}>{formatted}</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 400 }}>
        This page is under construction. We're building something great — check back soon!
      </p>
    </div>
  );
}
