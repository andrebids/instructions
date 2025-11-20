/**
 * Suggestion Engine
 * Generates smart suggestions based on context and user patterns
 */

import { getConversationMemory } from './conversationMemory';

/**
 * Generate greeting based on context
 */
export function generateSmartGreeting(context, language = 'pt') {
    const { timeOfDay, projectStatus, userActivity, frequentClient } = context;

    const greetings = {
        pt: {
            morning: 'Bom dia',
            afternoon: 'Boa tarde',
            evening: 'Boa noite'
        },
        en: {
            morning: 'Good morning',
            afternoon: 'Good afternoon',
            evening: 'Good evening'
        },
        fr: {
            morning: 'Bonjour',
            afternoon: 'Bon après-midi',
            evening: 'Bonsoir'
        }
    };

    const timeGreeting = greetings[language]?.[timeOfDay] || greetings.pt[timeOfDay];

    // New user - highest priority
    if (userActivity.isNewUser || projectStatus.total === 0) {
        const newUserMessages = {
            pt: `${timeGreeting}! Vamos criar o seu primeiro projeto juntos?`,
            en: `${timeGreeting}! Let's create your first project together!`,
            fr: `${timeGreeting}! Créons votre premier projet ensemble!`
        };
        return newUserMessages[language] || newUserMessages.pt;
    }

    // PRIORITY: Always encourage new project creation for existing users
    // Mention recent activity to encourage continuing momentum
    if (userActivity.projectsThisWeek > 0) {
        const createNewMessages = {
            pt: `${timeGreeting}! Criou ${userActivity.projectsThisWeek} projeto${userActivity.projectsThisWeek > 1 ? 's' : ''} esta semana. Quer criar mais um?`,
            en: `${timeGreeting}! You created ${userActivity.projectsThisWeek} project${userActivity.projectsThisWeek > 1 ? 's' : ''} this week. Want to create another?`,
            fr: `${timeGreeting}! Vous avez créé ${userActivity.projectsThisWeek} projet${userActivity.projectsThisWeek > 1 ? 's' : ''} cette semaine. Voulez-vous en créer un autre?`
        };
        return createNewMessages[language] || createNewMessages.pt;
    }

    // Encourage project creation even without recent activity
    if (userActivity.totalProjects > 0) {
        const encourageMessages = {
            pt: `${timeGreeting}! Pronto para criar um novo projeto?`,
            en: `${timeGreeting}! Ready to create a new project?`,
            fr: `${timeGreeting}! Prêt à créer un nouveau projet?`
        };
        return encourageMessages[language] || encourageMessages.pt;
    }

    // Default greeting with project creation focus
    const defaultMessages = {
        pt: `${timeGreeting}! Quer criar um novo projeto?`,
        en: `${timeGreeting}! Want to create a new project?`,
        fr: `${timeGreeting}! Voulez-vous créer un nouveau projet?`
    };
    return defaultMessages[language] || defaultMessages.pt;
}

/**
 * Generate client suggestion
 */
export function generateClientSuggestion(context, language = 'pt') {
    const memory = getConversationMemory();
    const lastClient = memory.getLastClient();

    if (!lastClient) {
        return null;
    }

    const suggestions = {
        pt: `Mesmo cliente da última vez (${lastClient.name})?`,
        en: `Same client as last time (${lastClient.name})?`,
        fr: `Même client que la dernière fois (${lastClient.name})?`
    };

    return {
        type: 'client',
        message: suggestions[language] || suggestions.pt,
        data: lastClient
    };
}

/**
 * Generate budget suggestion
 */
export function generateBudgetSuggestion(projectType = 'general', language = 'pt') {
    const memory = getConversationMemory();
    const budgetRange = memory.getBudgetRange(projectType);

    if (!budgetRange) {
        return null;
    }

    const { min, max, average } = budgetRange;

    const suggestions = {
        pt: `Os seus projetos costumam ter orçamentos entre €${min} e €${max}. Orçamento semelhante?`,
        en: `Your projects usually have budgets between €${min} and €${max}. Similar budget?`,
        fr: `Vos projets ont généralement des budgets entre €${min} et €${max}. Budget similaire?`
    };

    return {
        type: 'budget',
        message: suggestions[language] || suggestions.pt,
        data: { min, max, average }
    };
}

/**
 * Generate proactive action suggestions
 */
export function generateActionSuggestions(context, language = 'pt') {
    const suggestions = [];

    // PRIORITY 1: Always suggest creating a new project first
    const createProjectMessages = {
        pt: 'Criar novo projeto',
        en: 'Create new project',
        fr: 'Créer un nouveau projet'
    };
    suggestions.push({
        type: 'action',
        action: 'createNewProject',
        message: createProjectMessages[language] || createProjectMessages.pt,
        priority: 'high'
    });

    // PRIORITY 2: Suggest creating project for frequent client (if exists)
    if (context.frequentClient) {
        const messages = {
            pt: `Criar projeto para ${context.frequentClient.name}`,
            en: `Create project for ${context.frequentClient.name}`,
            fr: `Créer un projet pour ${context.frequentClient.name}`
        };
        suggestions.push({
            type: 'action',
            action: 'createForClient',
            message: messages[language] || messages.pt,
            data: context.frequentClient,
            priority: 'medium'
        });
    }

    // PRIORITY 3 (Low): Only show existing project management if specifically needed
    // These are now secondary and only shown as additional options

    // Suggest completing drafts (low priority)
    if (context.projectStatus.drafts > 2) { // Only if multiple drafts
        const messages = {
            pt: 'Ver projetos em rascunho',
            en: 'View draft projects',
            fr: 'Voir les projets en brouillon'
        };
        suggestions.push({
            type: 'action',
            action: 'viewDrafts',
            message: messages[language] || messages.pt,
            priority: 'low'
        });
    }

    // Suggest reviewing upcoming deadlines (low priority)
    if (context.projectStatus.upcomingDeadlines > 2) { // Only if multiple deadlines
        const messages = {
            pt: 'Ver projetos com entrega próxima',
            en: 'View upcoming deadlines',
            fr: 'Voir les échéances à venir'
        };
        suggestions.push({
            type: 'action',
            action: 'viewUpcomingDeadlines',
            message: messages[language] || messages.pt,
            priority: 'low'
        });
    }

    return suggestions;
}

/**
 * Generate validation feedback
 */
export function generateValidationFeedback(field, value, context, language = 'pt') {
    const feedback = {
        isValid: true,
        message: null,
        suggestion: null
    };

    // Budget validation
    if (field === 'budget') {
        const budgetValue = parseFloat(value);

        if (isNaN(budgetValue) || budgetValue <= 0) {
            feedback.isValid = false;
            const messages = {
                pt: 'O orçamento deve ser um valor positivo.',
                en: 'Budget must be a positive value.',
                fr: 'Le budget doit être une valeur positive.'
            };
            feedback.message = messages[language] || messages.pt;
            return feedback;
        }

        // Check if budget seems too low
        if (budgetValue < 100) {
            const messages = {
                pt: `€${budgetValue} parece baixo. Quis dizer €${budgetValue * 10}?`,
                en: `€${budgetValue} seems low. Did you mean €${budgetValue * 10}?`,
                fr: `€${budgetValue} semble faible. Vouliez-vous dire €${budgetValue * 10}?`
            };
            feedback.message = messages[language] || messages.pt;
            feedback.suggestion = (budgetValue * 10).toString();
        }
    }

    // Date validation
    if (field === 'endDate') {
        const now = new Date();
        const dateValue = new Date(value);

        if (dateValue < now) {
            feedback.isValid = false;
            const messages = {
                pt: 'Essa data já passou. Quis dizer o próximo mês?',
                en: 'That date has passed. Did you mean next month?',
                fr: 'Cette date est passée. Vouliez-vous dire le mois prochain?'
            };
            feedback.message = messages[language] || messages.pt;
        }
    }

    return feedback;
}
