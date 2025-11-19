/**
 * Main parser for complex project creation voice inputs
 * Combines all entity extraction utilities
 */

import { extractAllEntities } from './extractEntities';
import { extractDate } from './dateParser';
import { findBestClientMatch, isSameClientRequest } from './fuzzyClientMatch';

/**
 * Parse a complete voice input for project creation
 * @param {string} text - Voice input text
 * @param {Object} options - Parsing options
 * @param {Array} options.clients - Available clients for matching
 * @param {Object} options.lastProject - Last created project for "same client" references
 * @param {string} options.language - Language code (pt, en, fr)
 * @returns {Object} - Parsed project data
 */
export function parseProjectInput(text, options = {}) {
    const {
        clients = [],
        lastProject = null,
        language = 'pt'
    } = options;

    const result = {
        projectName: null,
        clientName: null,
        clientId: null,
        budget: null,
        endDate: null,
        confidence: {
            projectName: 0,
            client: 0,
            budget: 0,
            endDate: 0
        },
        raw: text
    };

    // Extract basic entities
    const entities = extractAllEntities(text);

    // Project Name
    if (entities.projectName) {
        result.projectName = entities.projectName;
        result.confidence.projectName = 0.8;
    }

    // Budget
    if (entities.budget !== null) {
        result.budget = entities.budget.toString();
        result.confidence.budget = 0.9;
    }

    // Date
    const dateObj = extractDate(text, language);
    if (dateObj) {
        result.endDate = dateObj;
        result.confidence.endDate = 0.85;
    }

    // Client - check for "same client" first
    if (isSameClientRequest(text) && lastProject?.client) {
        result.clientName = lastProject.client.name;
        result.clientId = lastProject.client.id;
        result.confidence.client = 1.0;
    } else if (entities.clientName) {
        // Try to match with existing clients
        const match = findBestClientMatch(entities.clientName, clients);

        if (match) {
            result.clientName = match.name;
            result.clientId = match.id;
            result.confidence.client = 0.9;
        } else {
            // New client
            result.clientName = entities.clientName;
            result.clientId = null; // Will need to create new client
            result.confidence.client = 0.7;
        }
    }

    return result;
}

/**
 * Determine which fields are missing from parsed data
 */
export function getMissingFields(parsedData) {
    const missing = [];

    if (!parsedData.projectName) {
        missing.push('projectName');
    }
    if (!parsedData.clientName && !parsedData.clientId) {
        missing.push('client');
    }
    if (!parsedData.budget) {
        missing.push('budget');
    }
    if (!parsedData.endDate) {
        missing.push('endDate');
    }

    return missing;
}

/**
 * Generate a summary of what was understood
 */
export function generateParsingSummary(parsedData, language = 'pt') {
    const parts = [];

    const labels = {
        pt: {
            project: 'Projeto',
            client: 'Cliente',
            budget: 'Orçamento',
            date: 'Entrega'
        },
        en: {
            project: 'Project',
            client: 'Client',
            budget: 'Budget',
            date: 'Delivery'
        },
        fr: {
            project: 'Projet',
            client: 'Client',
            budget: 'Budget',
            date: 'Livraison'
        }
    };

    const l = labels[language] || labels.pt;

    if (parsedData.projectName) {
        parts.push(`${l.project}: ${parsedData.projectName}`);
    }
    if (parsedData.clientName) {
        parts.push(`${l.client}: ${parsedData.clientName}`);
    }
    if (parsedData.budget) {
        parts.push(`${l.budget}: €${parsedData.budget}`);
    }
    if (parsedData.endDate) {
        const { year, month, day } = parsedData.endDate;
        parts.push(`${l.date}: ${day}/${month}/${year}`);
    }

    return parts.join(', ');
}
