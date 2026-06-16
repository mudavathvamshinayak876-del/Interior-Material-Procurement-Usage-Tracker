import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user, apiFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const wsRef = useRef(null);

  // Fetch all historical notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => n.status === 'unread').length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Setup WebSockets
      const wsUrl = import.meta.env.VITE_WS_URL || (
        import.meta.env.PROD 
          ? `wss://interior-material-procurement-usage.onrender.com` 
          : `ws://localhost:5000`
      );

      const connectWS = () => {
        try {
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_NOTIFICATION') {
              const newNotif = data.notification;
              
              // Only append if it's for this user role or is broadcasted (user_id is null)
              // If user is Admin or PM, show all notifications. For others, only show matches.
              const isRelevant = user.role === 'admin' || user.role === 'project_manager' || newNotif.user_id === user.id || !newNotif.user_id;

              if (isRelevant) {
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                // Trigger visual toast
                setToast({
                  id: newNotif.id,
                  message: newNotif.message,
                  type: newNotif.type
                });

                // Clear toast after 6 seconds
                setTimeout(() => {
                  setToast(current => current?.id === newNotif.id ? null : current);
                }, 6000);
              }
            }
          };

          ws.onclose = () => {
            console.log('WebSocket connection closed. Retrying in 5 seconds...');
            setTimeout(connectWS, 5000);
          };

          ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            ws.close();
          };
        } catch (err) {
          console.error('Failed to connect to WS:', err);
        }
      };

      connectWS();

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, status: 'read' } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await apiFetch('/api/notifications/read-all', { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, toast, setToast, markAsRead, markAllAsRead, refreshNotifications: fetchNotifications }}>
      {children}
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm w-full bg-slate-900 text-white rounded-lg shadow-2xl border-l-4 border-amber-500 overflow-hidden animate-bounce transition-all duration-300">
          <div className="p-4 flex items-start space-x-3">
            <div className="flex-1">
              <p className="text-xs uppercase font-bold text-amber-500 tracking-wider">Real-time Alert</p>
              <p className="text-sm font-medium mt-1">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
