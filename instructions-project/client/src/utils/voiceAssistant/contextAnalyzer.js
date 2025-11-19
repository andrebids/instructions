/**
 * Context Analyzer
 * Analyzes user context to provide intelligent greetings and suggestions
 */

/**
 * Analyze time of day
 */
export function getTimeOfDay() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return 'morning';
    } else if (hour >= 12 && hour < 18) {
        return 'afternoon';
    } else {
        return 'evening';
    }
}

/**
 * Analyze project status from projects array
 */
export function analyzeProjectStatus(projects) {
    if (!projects || projects.length === 0) {
        return {
            total: 0,
            drafts: 0,
            inProgress: 0,
            upcomingDeadlines: 0,
            isEmpty: true
        };
    }

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const analysis = {
        total: projects.length,
        drafts: 0,
        inProgress: 0,
        upcomingDeadlines: 0,
        isEmpty: false,
        recentProjects: []
    };

    projects.forEach(project => {
        // Count drafts
        if (project.status === 'draft') {
            analysis.drafts++;
        }

        // Count in progress
        if (project.status === 'inProgress' || project.status === 'created') {
            analysis.inProgress++;
        }

        // Check for upcoming deadlines
        if (project.endDate) {
            const endDate = new Date(project.endDate);
            if (endDate >= now && endDate <= oneWeekFromNow) {
                analysis.upcomingDeadlines++;
            }
        }

        // Track recent projects (last 7 days)
        if (project.createdAt) {
            const createdDate = new Date(project.createdAt);
            const daysSinceCreation = (now - createdDate) / (1000 * 60 * 60 * 24);
            if (daysSinceCreation <= 7) {
                analysis.recentProjects.push(project);
            }
        }
    });

    return analysis;
}

/**
 * Analyze user activity patterns
 */
export function analyzeUserActivity(projects) {
    if (!projects || projects.length === 0) {
        return {
            isNewUser: true,
            lastActivity: null,
            projectsThisWeek: 0,
            projectsThisMonth: 0
        };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let lastActivity = null;
    let projectsThisWeek = 0;
    let projectsThisMonth = 0;

    projects.forEach(project => {
        const createdDate = project.createdAt ? new Date(project.createdAt) : null;

        if (createdDate) {
            if (!lastActivity || createdDate > lastActivity) {
                lastActivity = createdDate;
            }

            if (createdDate >= oneWeekAgo) {
                projectsThisWeek++;
            }

            if (createdDate >= oneMonthAgo) {
                projectsThisMonth++;
            }
        }
    });

    return {
        isNewUser: projects.length === 0,
        lastActivity,
        projectsThisWeek,
        projectsThisMonth,
        totalProjects: projects.length
    };
}

/**
 * Get most frequent client from projects
 */
export function getMostFrequentClient(projects) {
    if (!projects || projects.length === 0) {
        return null;
    }

    const clientCount = {};

    projects.forEach(project => {
        if (project.client && project.client.id) {
            const clientId = project.client.id;
            if (!clientCount[clientId]) {
                clientCount[clientId] = {
                    client: project.client,
                    count: 0
                };
            }
            clientCount[clientId].count++;
        }
    });

    const entries = Object.values(clientCount);
    if (entries.length === 0) return null;

    entries.sort((a, b) => b.count - a.count);
    return entries[0].client;
}

/**
 * Analyze dashboard context for smart interactions
 */
export function analyzeDashboardContext(projects, user) {
    const timeOfDay = getTimeOfDay();
    const projectStatus = analyzeProjectStatus(projects);
    const userActivity = analyzeUserActivity(projects);
    const frequentClient = getMostFrequentClient(projects);

    return {
        timeOfDay,
        projectStatus,
        userActivity,
        frequentClient,
        user
    };
}

/**
 * Determine context priority for suggestions
 * Returns what should be highlighted to the user
 */
export function getContextPriority(context) {
    const priorities = [];

    // HIGHEST PRIORITY: Always encourage creating new projects
    priorities.push({
        type: 'createNewProject',
        priority: 'high',
        message: 'Create a new project'
    });

    // New user gets additional high priority
    if (context.userActivity.isNewUser || context.projectStatus.total === 0) {
        priorities.push({
            type: 'newUser',
            priority: 'high'
        });
    }

    // Medium priority: Frequent client (for creating new projects with them)
    if (context.frequentClient) {
        priorities.push({
            type: 'frequentClient',
            priority: 'medium',
            client: context.frequentClient
        });
    }

    // LOW PRIORITY: Existing project management
    // Only show if there are multiple items requiring attention

    // Drafts to complete (low priority, only if multiple)
    if (context.projectStatus.drafts > 2) {
        priorities.push({
            type: 'drafts',
            priority: 'low',
            count: context.projectStatus.drafts
        });
    }

    // Upcoming deadlines (low priority, only if multiple)
    if (context.projectStatus.upcomingDeadlines > 2) {
        priorities.push({
            type: 'deadline',
            priority: 'low',
            count: context.projectStatus.upcomingDeadlines
        });
    }

    return priorities.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}
