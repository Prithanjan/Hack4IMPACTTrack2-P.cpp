import React, { useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Zap, Trash2, Clock } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

function NotificationCenter() {
  const { notifications, notificationHistory, removeNotification, clearAll } = useNotification();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const getNotificationIcon = (type) => {
    const iconClass = 'w-5 h-5';
    const colors = {
      success: '#4ade80',
      error: '#ef4444',
      warning: '#eab308',
      info: '#3b82f6',
    };
    const color = colors[type] || '#3b82f6';

    const iconMap = {
      success: <CheckCircle size={20} style={{ color }} />,
      error: <AlertCircle size={20} style={{ color }} />,
      warning: <AlertCircle size={20} style={{ color }} />,
      info: <Info size={20} style={{ color }} />,
    };
    return iconMap[type] || iconMap.info;
  };

  const getBgColor = (type) => {
    const colors = {
      success: '#4ade8010',
      error: '#ef444410',
      warning: '#eab30810',
      info: '#3b82f610',
    };
    return colors[type] || colors.info;
  };

  const getBorderColor = (type) => {
    const colors = {
      success: '#4ade8030',
      error: '#ef444430',
      warning: '#eab30830',
      info: '#3b82f630',
    };
    return colors[type] || colors.info;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const unreadCount = notifications.length;
  const activeNotifications = showHistory ? notificationHistory : notifications;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowHistory(false);
        }}
        className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-lg transition-all relative group"
        title={`${unreadCount} notification${unreadCount !== 1 ? 's' : ''}`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75" style={{ background: 'var(--color-error)' }}></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: 'var(--color-error)' }}></span>
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          className="fixed md:absolute md:top-12 md:right-0 md:w-96 w-full h-screen md:h-auto md:max-h-[600px] rounded-none md:rounded-2xl z-50 flex flex-col"
          style={{
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* Header */}
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--color-outline-variant)' }}
          >
            <div>
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>
                Notifications
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                for {user?.email?.split('@')[0] || 'User'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:opacity-60 transition-all"
            >
              <X size={20} style={{ color: 'var(--color-on-surface-variant)' }} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <button
              onClick={() => setShowHistory(false)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                !showHistory
                  ? 'border-b-2'
                  : ''
              }`}
              style={{
                color: !showHistory ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                borderColor: !showHistory ? 'var(--color-primary)' : 'transparent',
              }}
            >
              Active ({unreadCount})
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                showHistory
                  ? 'border-b-2'
                  : ''
              }`}
              style={{
                color: showHistory ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                borderColor: showHistory ? 'var(--color-primary)' : 'transparent',
              }}
            >
              History
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {activeNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell size={32} style={{ color: 'var(--color-outline-variant)', opacity: 0.5 }} />
                <p className="text-sm mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {showHistory ? 'No notification history' : 'No new notifications'}
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--color-surface-container)' }}>
                {activeNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 hover:opacity-90 transition-all cursor-pointer group"
                    style={{ background: getBgColor(notif.type) }}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {notif.icon || getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4
                              className="font-semibold text-sm"
                              style={{ color: 'var(--color-on-surface)' }}
                            >
                              {notif.title}
                            </h4>
                            <p
                              className="text-xs mt-1 leading-relaxed"
                              style={{ color: 'var(--color-on-surface-variant)' }}
                            >
                              {notif.message}
                            </p>

                            {/* Personalized Info */}
                            {notif.personalized && Object.keys(notif.personalized).length > 0 && (
                              <div className="mt-2 text-xs space-y-1">
                                {notif.personalized.patientId && (
                                  <p style={{ color: 'var(--color-primary)' }}>
                                    📋 Patient: {notif.personalized.patientId}
                                  </p>
                                )}
                                {notif.personalized.confidence && (
                                  <p style={{ color: 'var(--color-primary)' }}>
                                    🎯 Confidence: {notif.personalized.confidence}%
                                  </p>
                                )}
                                {notif.personalized.diagnosis && (
                                  <p style={{ color: 'var(--color-primary)' }}>
                                    🩺 Diagnosis: {notif.personalized.diagnosis}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          {!showHistory && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notif.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--color-surface-container-high)] rounded"
                            >
                              <X size={16} style={{ color: 'var(--color-on-surface-variant)' }} />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Clock size={12} style={{ color: 'var(--color-outline)' }} />
                          <span className="text-[10px]" style={{ color: 'var(--color-outline)' }}>
                            {formatTime(new Date(notif.timestamp))}
                          </span>
                        </div>

                        {/* Action Button */}
                        {notif.action && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              notif.action.callback?.();
                              setIsOpen(false);
                            }}
                            className="mt-2 px-3 py-1.5 rounded text-xs font-semibold transition-all"
                            style={{
                              background: 'var(--color-primary)',
                              color: 'var(--color-on-primary)',
                            }}
                          >
                            {notif.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {activeNotifications.length > 0 && (
            <div
              className="p-3 border-t"
              style={{ borderColor: 'var(--color-outline-variant)' }}
            >
              <button
                onClick={() => {
                  if (showHistory) {
                    setShowHistory(false);
                  } else {
                    clearAll();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: 'var(--color-surface-container)',
                  border: '1px solid var(--color-outline-variant)',
                  color: 'var(--color-on-surface)',
                }}
              >
                <Trash2 size={14} />
                {showHistory ? 'Clear History' : 'Clear All'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          style={{ background: 'rgba(0,0,0,0.5)' }}
        />
      )}
    </div>
  );
}

export default NotificationCenter;
