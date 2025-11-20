/**
 * Conversation Memory System
 * Manages conversation state, context, and learning across sessions
 */

const STORAGE_KEY = 'voice_assistant_memory';
const MAX_CONVERSATION_HISTORY = 50;

/**
 * Conversation Memory Manager
 */
class ConversationMemory {
    constructor() {
        this.sessionData = {
            currentConversation: [],
            formContext: {},
            corrections: [],
            rejectedSuggestions: []
        };

        this.persistentData = this.loadPersistent();
    }

    /**
     * Load persistent data from localStorage
     */
    loadPersistent() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading conversation memory:', error);
        }

        return {
            frequentClients: {},
            budgetPatterns: {},
            projectNamePatterns: [],
            lastProjects: [],
            userPreferences: {}
        };
    }

    /**
     * Save persistent data to localStorage
     */
    savePersistent() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.persistentData));
        } catch (error) {
            console.error('Error saving conversation memory:', error);
        }
    }

    /**
     * Add message to conversation history
     */
    addMessage(sender, text) {
        this.sessionData.currentConversation.push({
            sender,
            text,
            timestamp: Date.now()
        });

        // Keep only last N messages
        if (this.sessionData.currentConversation.length > MAX_CONVERSATION_HISTORY) {
            this.sessionData.currentConversation = this.sessionData.currentConversation.slice(-MAX_CONVERSATION_HISTORY);
        }
    }

    /**
     * Update form context (what fields are filled, etc.)
     */
    updateFormContext(field, value) {
        this.sessionData.formContext[field] = {
            value,
            timestamp: Date.now()
        };
    }

    /**
     * Record a user correction
     */
    recordCorrection(field, oldValue, newValue) {
        this.sessionData.corrections.push({
            field,
            oldValue,
            newValue,
            timestamp: Date.now()
        });
    }

    /**
     * Record a rejected suggestion
     */
    recordRejectedSuggestion(type, suggestion) {
        this.sessionData.rejectedSuggestions.push({
            type,
            suggestion,
            timestamp: Date.now()
        });
    }

    /**
     * Get conversation history
     */
    getConversationHistory() {
        return this.sessionData.currentConversation;
    }

    /**
     * Get current form context
     */
    getFormContext() {
        return this.sessionData.formContext;
    }

    /**
     * Clear session data (but keep persistent learning)
     */
    clearSession() {
        this.sessionData = {
            currentConversation: [],
            formContext: {},
            corrections: [],
            rejectedSuggestions: []
        };
    }

    /**
     * Record a completed project for learning
     */
    recordProject(project) {
        // Add to recent projects
        this.persistentData.lastProjects.unshift({
            name: project.name,
            clientId: project.clientId,
            clientName: project.clientName,
            budget: project.budget,
            timestamp: Date.now()
        });

        // Keep only last 20 projects
        this.persistentData.lastProjects = this.persistentData.lastProjects.slice(0, 20);

        // Update client frequency
        if (project.clientId) {
            if (!this.persistentData.frequentClients[project.clientId]) {
                this.persistentData.frequentClients[project.clientId] = {
                    name: project.clientName,
                    count: 0,
                    lastUsed: null
                };
            }
            this.persistentData.frequentClients[project.clientId].count++;
            this.persistentData.frequentClients[project.clientId].lastUsed = Date.now();
        }

        // Update budget patterns (by project type if available)
        const budgetValue = parseFloat(project.budget);
        if (!isNaN(budgetValue)) {
            const type = project.type || 'general';
            if (!this.persistentData.budgetPatterns[type]) {
                this.persistentData.budgetPatterns[type] = [];
            }
            this.persistentData.budgetPatterns[type].push(budgetValue);

            // Keep only last 50 budgets per type
            if (this.persistentData.budgetPatterns[type].length > 50) {
                this.persistentData.budgetPatterns[type] = this.persistentData.budgetPatterns[type].slice(-50);
            }
        }

        this.savePersistent();
    }

    /**
     * Get most frequent clients
     */
    getFrequentClients(limit = 5) {
        const clients = Object.entries(this.persistentData.frequentClients)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return clients;
    }

    /**
     * Get last used client
     */
    getLastClient() {
        if (this.persistentData.lastProjects.length > 0) {
            const lastProject = this.persistentData.lastProjects[0];
            return {
                id: lastProject.clientId,
                name: lastProject.clientName
            };
        }
        return null;
    }

    /**
     * Get average budget for a project type
     */
    getAverageBudget(type = 'general') {
        const budgets = this.persistentData.budgetPatterns[type] || [];
        if (budgets.length === 0) return null;

        const sum = budgets.reduce((a, b) => a + b, 0);
        return Math.round(sum / budgets.length);
    }

    /**
     * Get budget range for a project type
     */
    getBudgetRange(type = 'general') {
        const budgets = this.persistentData.budgetPatterns[type] || [];
        if (budgets.length === 0) return null;

        return {
            min: Math.min(...budgets),
            max: Math.max(...budgets),
            average: this.getAverageBudget(type)
        };
    }

    /**
     * Check if user typically creates projects on certain days
     */
    getTypicalWorkdays() {
        const projects = this.persistentData.lastProjects;
        if (projects.length < 5) return null;

        const dayCount = {};
        projects.forEach(p => {
            const day = new Date(p.timestamp).getDay();
            dayCount[day] = (dayCount[day] || 0) + 1;
        });

        return dayCount;
    }

    /**
     * Clear all learning data (user privacy option)
     */
    clearAllData() {
        this.persistentData = {
            frequentClients: {},
            budgetPatterns: {},
            projectNamePatterns: [],
            lastProjects: [],
            userPreferences: {}
        };
        this.clearSession();
        this.savePersistent();
    }

    /**
     * Export data for debugging
     */
    exportData() {
        return {
            session: this.sessionData,
            persistent: this.persistentData
        };
    }
}

// Singleton instance
let memoryInstance = null;

export function getConversationMemory() {
    if (!memoryInstance) {
        memoryInstance = new ConversationMemory();
    }
    return memoryInstance;
}

export default ConversationMemory;
