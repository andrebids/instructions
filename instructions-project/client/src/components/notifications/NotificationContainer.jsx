// NotificationContainer.jsx
import React, { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationToast } from '../notifications/NotificationToast';

export function NotificationContainer() {
    const { notifications, markAsRead } = useNotifications();

    // Auto-dismiss after 8 seconds
    useEffect(() => {
        const timers = notifications.map((notif) =>
            setTimeout(() => {
                markAsRead(notif.id);
            }, 8000)
        );
        return () => {
            timers.forEach((t) => clearTimeout(t));
        };
    }, [notifications, markAsRead]);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 max-w-md">
            {notifications.map((notif) => (
                <NotificationToast
                    key={notif.id}
                    notification={notif}
                    onClose={() => markAsRead(notif.id)}
                />
            ))}
        </div>
    );
}
