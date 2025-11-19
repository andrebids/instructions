/**
 * Calculates the Levenshtein distance between two strings.
 * This metric represents the minimum number of single-character edits (insertions, deletions or substitutions)
 * required to change one word into the other.
 * 
 * @param {string} a 
 * @param {string} b 
 * @returns {number} The distance
 */
export const levenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

/**
 * Checks if a text contains a phrase using fuzzy matching.
 * @param {string} text The text to search in (e.g., user transcript)
 * @param {string} phrase The target phrase to look for
 * @param {number} threshold Similarity threshold (0 to 1), default 0.8
 * @returns {boolean}
 */
export const fuzzyContains = (text, phrase, threshold = 0.8) => {
    if (!text || !phrase) return false;

    const normalizedText = text.toLowerCase().trim();
    const normalizedPhrase = phrase.toLowerCase().trim();

    // Direct match check first for performance
    if (normalizedText.includes(normalizedPhrase)) return true;

    // Split text into words to find a window of similar length to the phrase
    const textWords = normalizedText.split(' ');
    const phraseWords = normalizedPhrase.split(' ');
    const phraseLen = phraseWords.length;

    // If phrase is longer than text, check the whole text
    if (phraseLen > textWords.length) {
        const distance = levenshteinDistance(normalizedText, normalizedPhrase);
        const maxLen = Math.max(normalizedText.length, normalizedPhrase.length);
        const similarity = 1 - (distance / maxLen);
        return similarity >= threshold;
    }

    // Sliding window check
    for (let i = 0; i <= textWords.length - phraseLen; i++) {
        const windowSlice = textWords.slice(i, i + phraseLen).join(' ');
        const distance = levenshteinDistance(windowSlice, normalizedPhrase);
        const maxLen = Math.max(windowSlice.length, normalizedPhrase.length);
        const similarity = 1 - (distance / maxLen);

        if (similarity >= threshold) return true;
    }

    return false;
};
