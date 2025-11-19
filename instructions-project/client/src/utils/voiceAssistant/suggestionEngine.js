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

    // New user
    if (userActivity.isNewUser || projectStatus.total === 0) {
        const newUserMessages = {
            pt: `${timeGreeting}! Vamos criar o seu primeiro projeto juntos?`,
            en: `${timeGreeting}! Let's create your first project together!`,
            fr: `${timeGreeting}! Créons votre premier projet ensemble!`
        };
        return newUserMessages[language] || newUserMessages.pt;
    }

    // Upcoming deadlines
    if (projectStatus.upcomingDeadlines > 0) {
        const deadlineMessages = {
            pt: `${timeGreeting}! Tem ${projectStatus.upcomingDeadlines} projeto${projectStatus.upcomingDeadlines > 1 ? 's' : ''} com entrega esta semana. Quer revê-los?`,
            en: `${timeGreeting}! You have ${projectStatus.upcomingDeadlines} project${projectStatus.upcomingDeadlines > 1 ? 's' : ''} due this week. Want to review them?`,
            fr: `${timeGreeting}! Vous avez ${projectStatus.upcomingDeadlines} projet${projectStatus.upcomingDeadlines > 1 ? 's' : ''} à livrer cette semaine. Voulez-vous les examiner?`
        };
        return deadlineMessages[language] || deadlineMessages.pt;
    }

    // Drafts to complete
    if (projectStatus.drafts > 0) {
        const draftMessages = {
            pt: `${timeGreeting}! Tem ${projectStatus.drafts} projeto${projectStatus.drafts > 1 ? 's' : ''} em rascunho. Quer finalizar algum?`,
            en: `${timeGreeting}! You have ${projectStatus.drafts} draft project${projectStatus.drafts > 1 ? 's' : ''}. Want to finish one?`,
            fr: `${timeGreeting}! Vous avez ${projectStatus.drafts} projet${projectStatus.drafts > 1 ? 's' : ''} en brouillon. Voulez-vous en terminer un?`
        };
        return draftMessages[language] || draftMessages.pt;
    }

    // Recent activity with frequent client
    if (userActivity.projectsThisWeek > 0 && frequentClient) {
        const activityMessages = {
            pt: `${timeGreeting}! Criou ${userActivity.projectsThisWeek} projeto${userActivity.projectsThisWeek > 1 ? 's' : ''} esta semana. Pronto para mais um?`,
            en: `${timeGreeting}! You created ${userActivity.projectsThisWeek} project${userActivity.projectsThisWeek > 1 ? 's' : ''} this week. Ready for another?`,
            fr: `${timeGreeting}! Vous avez créé ${userActivity.projectsThisWeek} projet${userActivity.projectsThisWeek > 1 ? 's' : ''} cette semaine. Prêt pour un autre?`
        };
        return activityMessages[language] || activityMessages.pt;
    }

    // Default greeting
    const defaultMessages = {
        pt: `${timeGreeting}! Como posso ajudar?`,
        en: `${timeGreeting}! How can I help?`,
        fr: `${timeGreeting}! Comment puis-je vous aider?`
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

    // Suggest reviewing upcoming deadlines
    if (context.projectStatus.upcomingDeadlines > 0) {
        const messages = {
            pt: 'Ver projetos com entrega esta semana',
            en: 'View projects due this week',
            fr: 'Voir les projets à livrer cette semaine'
        };
        suggestions.push({
            type: 'action',
            action: 'viewUpcomingDeadlines',
            message: messages[language] || messages.pt
        });
    }

    // Suggest completing drafts
    if (context.projectStatus.drafts > 0) {
        const messages = {
            pt: 'Finalizar projetos em rascunho',
            en: 'Complete draft projects',
            fr: 'Terminer les projets en brouillon'
        };
        suggestions.push({
            type: 'action',
            action: 'completeDrafts',
            message: messages[language] || messages.pt
        });
    }

    // Suggest creating project for frequent client
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
            data: context.frequentClient
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
