// NotificationToast.jsx
import React from 'react';
import { Button } from '@heroui/react';
import { Icon as Iconify } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

export function NotificationToast({ notification, onClose }) {
    const { title, message, type, url, persistent } = notification;
    const navigate = useNavigate();

    const iconMap = {
        observation: 'lucide:message-square',
        warning: 'lucide:alert-triangle',
        success: 'lucide:check-circle',
        error: 'lucide:x-circle',
        info: 'lucide:info',
        default: 'lucide:bell'
    };

    const colorMap = {
        observation: 'bg-blue-500',
        warning: 'bg-orange-500',
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-400',
        default: 'bg-primary-500'
    };

    const handleClick = () => {
        if (url) {
            onClose();
            // Small delay to ensure notification is closed before navigation
            setTimeout(() => {
                navigate(url);
            }, 100);
        }
    };

    const isClickable = !!url;

    return (
        <div
            className={`
                bg-white dark:bg-default-100 backdrop-blur-md border border-default-200/50 
                rounded-xl shadow-xl p-4 min-w-[320px] max-w-[400px]
                flex items-start gap-3
                transition-all duration-300 ease-out
                hover:shadow-2xl hover:scale-[1.02]
                ${isClickable ? 'cursor-pointer' : ''}
                animate-slide-in-right
            `}
            onClick={isClickable ? handleClick : undefined}
            role={isClickable ? 'button' : 'alert'}
            tabIndex={isClickable ? 0 : -1}
        >
            <div className={`
                ${colorMap[type] || colorMap.default} 
                p-2 rounded-lg flex items-center justify-center
                shadow-sm
            `}>
                <Iconify
                    icon={iconMap[type] || iconMap.default}
                    className="text-white"
                    width={20}
                />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-white mb-0.5">
                    {title}
                </h4>
                <p className="text-xs text-white/90 leading-relaxed line-clamp-2">
                    {message}
                </p>
                {isClickable && (
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary dark:text-primary-400 font-medium">
                        <span>Click to view</span>
                        <Iconify icon="lucide:arrow-right" width={12} />
                    </div>
                )}
            </div>
            {!persistent && (
                <div onClick={(e) => e.stopPropagation()}>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={onClose}
                        className="hover:bg-default-100 dark:hover:bg-default-200 transition-colors flex-shrink-0"
                        aria-label="Close notification"
                    >
                        <Iconify icon="lucide:x" width={16} />
                    </Button>
                </div>
            )}
        </div>
    );
}
