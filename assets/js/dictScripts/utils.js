import { universalPendingChanges } from './initFormEventListeners.js';

/**
 * Gets related words by root.
 *
 * @param {Array} allRows - The array of all dictionary rows.
 * @returns {Array} - The array of related words.
 */
export function getRelatedWordsByRoot(allRows) {
    // Calculate related words and derivative roots
    allRows.forEach(clnrow => {
        let relatedWords = [];

        // Ensure morph is an array
        if (typeof clnrow.morph === 'string') {
            clnrow.morph = clnrow.morph.split(',').map(i => i.trim());
        }

        // Initialize morph as an empty array if undefined or null
        if (!Array.isArray(clnrow.morph)) {
            clnrow.morph = [];
        }

        // Logic for root type
        if (clnrow.type === 'root') {
            const matchingWords = allRows.filter(r => {
                if (Array.isArray(r.morph) && r.type === 'word') {
                    return r.morph.some(item => item.toLowerCase() === clnrow.title.toLowerCase());
                }
                return false;
            });
            relatedWords.push(...matchingWords.map(r => r.title));
        }
        // Logic for word type
        else if (clnrow.type === 'word') {
            clnrow.morph.forEach(mrphIt => {
                if (mrphIt) {
                    const matchingWords = allRows.filter(r => {
                        if (Array.isArray(r.morph) && r.type === 'word') {
                            return r.morph.some(item => item.toLowerCase() === mrphIt.toLowerCase());
                        }
                        return false;
                    });
                    relatedWords.push(...matchingWords.map(r => r.title));
                }
            });
        }

        clnrow.related = relatedWords.length > 0 ? relatedWords : ['No related words found'];
    });

    return allRows;
}

/**
 * Highlights the search term in the specified field.
 *
 * @param {string} text - The text to search within.
 * @param {string} term - The term to highlight.
 * @param {Object} searchIn - The fields to search within.
 * @param {Object} row - The current row being processed.
 * @returns {string} - The text with highlighted terms if criteria are met.
 */
export function highlight(text, term, searchIn = { word: true, root: true, definition: false, etymology: false }, row) {
    if (!text || !term) return text;

    const normalizedTerm = term.toLowerCase();
    let regex;

    if (searchIn.word && row.type === 'word' && text === row.title) {
        regex = new RegExp(`(${normalizedTerm})`, 'gi');
    } else if (searchIn.root && row.type === 'root' && text === row.title) {
        regex = new RegExp(`(${normalizedTerm})`, 'gi');
    } else if (searchIn.definition && text === row.meta) {
        regex = new RegExp(`(${normalizedTerm})`, 'gi');
    } else if (searchIn.etymology && Array.isArray(row.morph) && row.morph.includes(text)) {
        regex = new RegExp(`(${normalizedTerm})`, 'gi');
    } else {
        return text;
    }

    return text.replace(regex, '<mark style="background-color: yellow;">$1</mark>');
}

// Utility function to sanitize HTML
export function sanitizeHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = html;
    return tempDiv.innerHTML;
}

/**
 * Creates a hyperlink for dictionary entries if they exist.
 *
 * @param {string} searchTerm - The search term to highlight in the title.
 * @param {string} title - The title of the related word.
 * @param {Array} allRows - The array of all dictionary rows.
 * @returns {string} - The HTML string of the hyperlink if found, otherwise the original string.
 */
export async function createHyperlink(title, searchTerm = '', allRows = []) {
    //console.log('Searching for title:', title);
    const relatedRow = allRows.find(r => {
        const isMatch = r.title.trim().toLowerCase() === title.trim().toLowerCase();
        //console.log('Comparing with row title:', r.title, 'Match:', isMatch);
        return isMatch;
    });
    //console.log('Title:', title);
    //console.log('Related Row:', relatedRow);

    if (relatedRow) {
        const idParam = relatedRow.type === 'root' ? 'rootid' : 'wordid';
        const highlightedTitle = highlight(title, searchTerm, universalPendingChanges.searchIn, relatedRow);
        const hyperlink = `<a href="?${idParam}=${relatedRow.id}" style="color: green;">${highlightedTitle}</a>`;
        //console.log('Hyperlink:', hyperlink);
        return hyperlink;
    } else {
        //console.log('Title not found, returning original title:', title);
        return title;
    }
}
/**
 * Copies text to the clipboard.
 *
 * @param {string} text - The text to copy to the clipboard.
 */
export function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

/**
 * Function to calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Levenshtein distance
 */
export function levenshteinDistance(a, b) {
    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Function to calculate the similarity between two strings using Levenshtein distance
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
export function getSimilarity(a, b) {
    const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
    return 1 - distance / Math.max(a.length, b.length);
}

// Function to display an error message
export function displayError(message) {
    // Get the existing error container
    const errorContainer = document.getElementById('error-container');

    if (!errorContainer) {
        console.error('Error container not found.');
        return;
    }

    // Summarize the error message
    const summary = summarizeError(message);

    // Set the error message
    errorContainer.textContent = summary;

    // Show the error container
    errorContainer.classList.remove('hidden');

    // Hide the error container after a few seconds
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 3000);
}

// Function to summarize the error message
function summarizeError(message) {
    if (message.length > 100) {
        return message.substring(0, 97) + '...';
    }
    return message;
}

// Example usage
// displayError('An error occurred while processing your request. Please try again later.');
