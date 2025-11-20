/**
 * Parse natural language dates from voice input
 * Supports multiple languages: PT, EN, FR
 */

import { today, getLocalTimeZone } from "@internationalized/date";

/**
 * Parse relative date expressions
 */
export function parseNaturalDate(text, language = 'pt') {
    const lowerText = text.toLowerCase();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Helper to create CalendarDate from Date object
    const toCalendarDate = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // CalendarDate months are 1-indexed
        const day = date.getDate();
        return { year, month, day };
    };

    // Pattern 1: "end of month" / "fim do mês" / "fin du mois"
    const endOfMonthPatterns = {
        pt: /(?:fim|final)\s+do\s+m[eê]s/,
        en: /end\s+of\s+(?:the\s+)?month/,
        fr: /fin\s+du\s+mois/
    };

    for (const [lang, pattern] of Object.entries(endOfMonthPatterns)) {
        if (pattern.test(lowerText)) {
            const lastDay = new Date(currentYear, currentMonth + 1, 0);
            return toCalendarDate(lastDay);
        }
    }

    // Pattern 2: "next month" / "próximo mês" / "mois prochain"
    const nextMonthPatterns = {
        pt: /pr[oó]ximo\s+m[eê]s/,
        en: /next\s+month/,
        fr: /mois\s+prochain/
    };

    for (const [lang, pattern] of Object.entries(nextMonthPatterns)) {
        if (pattern.test(lowerText)) {
            const nextMonth = new Date(currentYear, currentMonth + 1, 15); // Mid next month
            return toCalendarDate(nextMonth);
        }
    }

    // Pattern 3: "mid-[month]" / "meio de [month]" / "mi-[month]"
    const midMonthPatterns = {
        pt: /(?:meio|meados)\s+de\s+(\w+)/,
        en: /mid[- ](\w+)/,
        fr: /mi[- ](\w+)/
    };

    for (const [lang, pattern] of Object.entries(midMonthPatterns)) {
        const match = lowerText.match(pattern);
        if (match) {
            const monthName = match[1];
            const monthIndex = getMonthIndex(monthName, lang);
            if (monthIndex !== -1) {
                let year = currentYear;
                // If month is before current month, assume next year
                if (monthIndex < currentMonth) {
                    year++;
                }
                const midDate = new Date(year, monthIndex, 15);
                return toCalendarDate(midDate);
            }
        }
    }

    // Pattern 4: "in X weeks/days" / "em X semanas/dias" / "dans X semaines/jours"
    const relativePatterns = {
        pt: /em\s+(\d+)\s+(semanas?|dias?)/,
        en: /in\s+(\d+)\s+(weeks?|days?)/,
        fr: /dans\s+(\d+)\s+(semaines?|jours?)/
    };

    for (const [lang, pattern] of Object.entries(relativePatterns)) {
        const match = lowerText.match(pattern);
        if (match) {
            const amount = parseInt(match[1]);
            const unit = match[2];
            const isWeeks = /semana|week|semaine/.test(unit);
            const daysToAdd = isWeeks ? amount * 7 : amount;

            const futureDate = new Date(now);
            futureDate.setDate(futureDate.getDate() + daysToAdd);
            return toCalendarDate(futureDate);
        }
    }

    // Pattern 5: Specific month names
    const monthMatch = lowerText.match(/\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i);

    if (monthMatch) {
        const monthName = monthMatch[1];
        const monthIndex = getMonthIndex(monthName, language);

        if (monthIndex !== -1) {
            // Look for day number near the month name
            const dayMatch = lowerText.match(new RegExp(`(\\d{1,2})\\s+(?:de\\s+)?${monthName}|${monthName}\\s+(\\d{1,2})`, 'i'));
            const day = dayMatch ? parseInt(dayMatch[1] || dayMatch[2]) : 15; // Default to mid-month

            let year = currentYear;
            // If month is before current month, assume next year
            if (monthIndex < currentMonth) {
                year++;
            }

            return { year, month: monthIndex + 1, day };
        }
    }

    // Pattern 6: Direct date format "DD/MM" or "DD-MM"
    const dateMatch = lowerText.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);

        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            let year = currentYear;
            // If date is in the past, assume next year
            if (month - 1 < currentMonth || (month - 1 === currentMonth && day < now.getDate())) {
                year++;
            }
            return { year, month, day };
        }
    }

    return null;
}

/**
 * Get month index (0-11) from month name in any supported language
 */
function getMonthIndex(monthName, language = 'pt') {
    const months = {
        pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
        en: ['january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'],
        fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
            'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    };

    const lowerMonth = monthName.toLowerCase();

    // Try all languages
    for (const [lang, monthList] of Object.entries(months)) {
        const index = monthList.findIndex(m => m.startsWith(lowerMonth.substring(0, 3)));
        if (index !== -1) {
            return index;
        }
    }

    return -1;
}

/**
 * Extract date from text and return as CalendarDate-compatible object
 */
export function extractDate(text, language = 'pt') {
    const dateObj = parseNaturalDate(text, language);

    if (!dateObj) {
        return null;
    }

    return dateObj;
}
