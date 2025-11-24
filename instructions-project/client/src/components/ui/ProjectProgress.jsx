import React from 'react';
import { Progress } from '@heroui/react';
import { useTranslation } from 'react-i18next';

// Project status mapping to progress values and colors
const STATUS_CONFIG = {
    'draft': { value: 5, color: 'default', gradient: 'from-gray-300 to-gray-400' },
    'created': { value: 15, color: 'primary', gradient: 'from-blue-300 to-blue-400' },
    'in_progress': { value: 50, color: 'secondary', gradient: 'from-purple-400 to-purple-600' },
    'in_queue': { value: 35, color: 'warning', gradient: 'from-yellow-400 to-orange-400' },
    'finished': { value: 85, color: 'success', gradient: 'from-green-400 to-green-500' },
    'approved': { value: 100, color: 'success', gradient: 'from-green-500 to-green-700' },
    'cancelled': { value: 0, color: 'danger', gradient: 'from-red-400 to-red-600' }
};

export function ProjectProgress({ status, endDate, showLabel = true, size = 'md', className = '' }) {
    const { t } = useTranslation();

    const config = STATUS_CONFIG[status] || STATUS_CONFIG['draft'];

    // Calculate days remaining until deadline
    const getDaysRemaining = () => {
        if (!endDate) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deadline = new Date(endDate);
        deadline.setHours(0, 0, 0, 0);

        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    };

    // Get translated status label
    const getStatusLabel = () => {
        const statusKey = `pages.projectDetails.status.${status}`;
        return t(statusKey);
    };

    // Get deadline label and progress
    const getDeadlineInfo = () => {
        const daysRemaining = getDaysRemaining();

        if (daysRemaining === null) {
            return null;
        }

        let label = '';
        let progressValue = 0;
        let colorScheme = 'success';

        if (daysRemaining < 0) {
            label = t('pages.projectDetails.overdue', { days: Math.abs(daysRemaining) });
            progressValue = 100;
            colorScheme = 'danger';
        } else if (daysRemaining === 0) {
            label = t('pages.projectDetails.dueToday');
            progressValue = 100;
            colorScheme = 'warning';
        } else if (daysRemaining === 1) {
            label = t('pages.projectDetails.dueTomorrow');
            progressValue = 95;
            colorScheme = 'warning';
        } else {
            label = t('pages.projectDetails.daysRemaining', { days: daysRemaining });
            // Calculate progress based on time elapsed (assuming 30 days total for visualization)
            const totalDays = 30;
            progressValue = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));

            if (daysRemaining <= 3) {
                colorScheme = 'danger';
            } else if (daysRemaining <= 7) {
                colorScheme = 'warning';
            } else {
                colorScheme = 'success';
            }
        }

        return { label, progressValue, colorScheme };
    };

    const deadlineInfo = getDeadlineInfo();

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Project Status Progress */}
            <Progress
                classNames={{
                    base: "w-full",
                    track: "drop-shadow-md border border-default-200",
                    indicator: `bg-gradient-to-r ${config.gradient}`,
                    label: "tracking-wider font-medium text-default-700",
                    value: "text-foreground/60 font-semibold",
                }}
                label={showLabel ? t('pages.projectDetails.projectStatus') : undefined}
                valueLabel={getStatusLabel()}
                radius="sm"
                showValueLabel={true}
                size={size}
                value={config.value}
                color={config.color}
            />

            {/* Deadline Progress */}
            {deadlineInfo && (
                <Progress
                    classNames={{
                        base: "w-full",
                        track: "drop-shadow-md border border-default-200",
                        indicator: deadlineInfo.colorScheme === 'danger'
                            ? 'bg-gradient-to-r from-red-400 to-red-600'
                            : deadlineInfo.colorScheme === 'warning'
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                : 'bg-gradient-to-r from-green-400 to-green-600',
                        label: "tracking-wider font-medium text-default-700",
                        value: "text-foreground/60 font-semibold",
                    }}
                    label={showLabel ? t('pages.projectDetails.deadline') : undefined}
                    valueLabel={deadlineInfo.label}
                    radius="sm"
                    showValueLabel={true}
                    size={size}
                    value={deadlineInfo.progressValue}
                    color={deadlineInfo.colorScheme}
                />
            )}
        </div>
    );
}
