import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotif = {
      id,
      type: notification.type || 'info', // 'success', 'error', 'warning', 'info'
      icon: notification.icon,
      title: notification.title,
      message: notification.message,
      duration: notification.duration || 5000,
      timestamp: new Date(),
      action: notification.action,
      personalized: notification.personalized || {},
    };

    setNotifications(prev => [...prev, newNotif]);
    setNotificationHistory(prev => [newNotif, ...prev].slice(0, 50)); // Keep last 50

    if (newNotif.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotif.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      notificationHistory,
      addNotification,
      removeNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
