/**
 * Fuzzy matching for client names
 * Helps match partial names or slight variations to existing clients
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function similarityScore(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
        return 1.0;
    }

    const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - distance) / longer.length;
}

/**
 * Check if a partial name matches a full name
 * e.g., "Maria" matches "Maria Silva"
 */
function partialNameMatch(partialName, fullName) {
    const partialLower = partialName.toLowerCase().trim();
    const fullLower = fullName.toLowerCase().trim();

    // Exact match
    if (fullLower === partialLower) {
        return 1.0;
    }

    // Check if partial is a complete word in full name
    const fullWords = fullLower.split(/\s+/);
    const partialWords = partialLower.split(/\s+/);

    // All partial words must match full words
    const allMatch = partialWords.every(pWord =>
        fullWords.some(fWord => fWord === pWord || fWord.startsWith(pWord))
    );

    if (allMatch) {
        return 0.9;
    }

    // Check if partial is start of full name
    if (fullLower.startsWith(partialLower)) {
        return 0.85;
    }

    // Fuzzy match on individual words
    let bestWordScore = 0;
    for (const pWord of partialWords) {
        for (const fWord of fullWords) {
            const score = similarityScore(pWord, fWord);
            if (score > bestWordScore) {
                bestWordScore = score;
            }
        }
    }

    return bestWordScore;
}

/**
 * Find best matching client from a list
 * @param {string} inputName - Name from voice input
 * @param {Array} clients - Array of client objects with 'name' property
 * @param {number} threshold - Minimum similarity score (0-1)
 * @returns {Object|null} - Best matching client or null
 */
export function findBestClientMatch(inputName, clients, threshold = 0.7) {
    if (!inputName || !clients || clients.length === 0) {
        return null;
    }

    let bestMatch = null;
    let bestScore = threshold;

    for (const client of clients) {
        const score = partialNameMatch(inputName, client.name);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = client;
        }
    }

    return bestMatch;
}

/**
 * Get all clients matching above threshold
 * @param {string} inputName - Name from voice input
 * @param {Array} clients - Array of client objects
 * @param {number} threshold - Minimum similarity score
 * @returns {Array} - Array of matching clients with scores
 */
export function findAllClientMatches(inputName, clients, threshold = 0.6) {
    if (!inputName || !clients || clients.length === 0) {
        return [];
    }

    const matches = [];

    for (const client of clients) {
        const score = partialNameMatch(inputName, client.name);

        if (score >= threshold) {
            matches.push({
                client,
                score,
                confidence: score >= 0.9 ? 'high' : score >= 0.75 ? 'medium' : 'low'
            });
        }
    }

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
}

/**
 * Check if input is asking for "same client" or "last client"
 */
export function isSameClientRequest(text) {
    const patterns = [
        // Portuguese
        /\b(?:mesmo|mesma|igual|anterior|último|última)\s+cliente\b/i,
        /\bclient[e]?\s+(?:mesmo|mesma|igual|anterior|último|última)\b/i,
        // English
        /\b(?:same|last|previous)\s+client\b/i,
        /\bclient\s+(?:same|last|previous)\b/i,
        // French
        /\b(?:même|dernier|précédent)\s+client\b/i,
        /\bclient\s+(?:même|dernier|précédent)\b/i
    ];

    return patterns.some(pattern => pattern.test(text));
}
