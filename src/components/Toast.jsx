import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useMemo(() => ({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 6000),
    warning: (msg) => addToast(msg, 'warning', 5000),
    info: (msg) => addToast(msg, 'info'),
  }), [addToast]);

  // For confirm dialogs
  const [confirmState, setConfirmState] = useState(null);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const handleConfirm = (result) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  const ICONS = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type} toast--enter`}>
            <div className="toast__icon">{ICONS[t.type]}</div>
            <p className="toast__message">{t.message}</p>
            <button className="toast__close" onClick={() => removeToast(t.id)}>
              <X size={16} />
            </button>
            <div className="toast__progress" style={{ animationDuration: t.type === 'error' ? '6s' : '4s' }} />
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmState && (
        <div className="confirm-overlay" onClick={() => handleConfirm(false)}>
          <div className="confirm-dialog animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="confirm-dialog__icon">
              <AlertTriangle size={32} />
            </div>
            <h3>Are you sure?</h3>
            <p>{confirmState.message}</p>
            <div className="confirm-dialog__actions">
              <button className="btn btn--ghost" onClick={() => handleConfirm(false)}>Cancel</button>
              <button className="btn btn--primary btn--danger-solid" onClick={() => handleConfirm(true)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
