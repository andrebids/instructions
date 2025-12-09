// NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addNotification = useCallback((notification) => {
        const newNotif = {
            id: Date.now(),
            ...notification,
            read: false,
            timestamp: new Date()
        };
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((c) => c + 1);
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications((prev) => {
            const notification = prev.find((n) => n.id === id);
            const wasUnread = notification && !notification.read;
            
            // Update unread count if the notification was unread
            if (wasUnread) {
                setUnreadCount((c) => Math.max(0, c - 1));
            }
            
            // Remove the notification from the list
            return prev.filter((n) => n.id !== id);
        });
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, addNotification, markAsRead, clearAll }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
