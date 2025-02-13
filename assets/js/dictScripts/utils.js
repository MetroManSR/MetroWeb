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
 * @param {string|array} term - The term or terms to highlight.
 * @param {Object} searchIn - The fields to search within.
 * @param {Object} row - The current row being processed.
 * @returns {string} - The text with highlighted terms if criteria are met.
 */
export function highlight(text, term, searchIn = { word: true, root: true, definition: false, etymology: false }, row) {
    if (!text || !term) return text;

    const terms = Array.isArray(term) ? term : [term];
    let highlightedText = text;

    terms.forEach(normalizedTerm => {
        const lowerCasedTerm = normalizedTerm.toLowerCase();
        let regex;

        if (searchIn.word && row.type === 'word' && text === row.title) {
            regex = new RegExp(`(${lowerCasedTerm})`, 'gi');
        } else if (searchIn.root && row.type === 'root' && text === row.title) {
            regex = new RegExp(`(${lowerCasedTerm})`, 'gi');
        } else if (searchIn.definition && text === row.meta) {
            regex = new RegExp(`(${lowerCasedTerm})`, 'gi');
        } else if (searchIn.etymology && Array.isArray(row.morph) && row.morph.includes(text)) {
            regex = new RegExp(`(${lowerCasedTerm})`, 'gi');
        } else {
            return text;
        }

        highlightedText = highlightedText.replace(regex, '<mark style="background-color: yellow;">$1</mark>');
    });

    return highlightedText;
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
 * @param {string|array} searchTerm - The search term or terms to highlight in the title.
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
 * Function to calculate similarity between two strings.
 *
 * @param {string} str1 - The first string.
 * @param {string} str2 - The second string.
 * @returns {number} - A similarity score between 0 and 1.
 */
export function getSimilarity(str1, str2) {
    let longer = str1;
    let shorter = str2;
    if (str1.length < str2.length) {
        longer = str2;
        shorter = str1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

/**
 * Compute the edit distance between two strings.
 * @param {string} str1 - The first string.
 * @param {string} str2 - The second string.
 * @returns {number} - The edit distance.
 */
export function editDistance(str1, str2) {
    const costs = [];
    for (let i = 0; i <= str1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= str2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) {
            costs[str2.length] = lastValue;
        }
    }
    return costs[str2.length];
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
    errorContainer.textContent[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/romaaji/asnap/tree/a85146f6f3e10ed3193308c3c1f0087a1f567579/src%2Futils%2Fhelper.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "1")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/whbrown/GardenGnome/tree/d4a87ff176105d23f617b591db0d9fd20398eaf7/utils%2FgetLevenshteinDistance.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "2")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/kkohnFico/MicroFrontend/tree/8eb5e72075b6354ea140683f52bbb78c8b97ee64/node_modules%2F@angular-devkit%2Fcore%2Fsrc%2Futils%2Fstrings.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "3")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/onechiporenko/eslint-plugin-ember-cleanup/tree/83618c6ba242d6349f4d724d793bb6e05f057b88/lib%2Futils%2Fstring.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "4")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/ChandanNaik/30-Seconds-of-JavaScript/tree/fb39acfdc5d1b1346d6da8c715f59d79ae8c938e/snippets_archive%2FREADME.md?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "5")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/JPShankel/js_webgames/tree/7d2ec9a8df2981903168d4d26bc97c54b29d4036/nodejs%2Futils.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "6")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/rpt-labs/ghostbuster/tree/e09b68817fcdba1c6c2db342057aa72c7cb31813/common%2Futils.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "7")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/Abelintegration/website/tree/48029119d434c4e104118689f67a3d8667aa3b4b/error%2Fsearch.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "8")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/DavideTriso/simple-and-advanced-search/tree/dfabeddd4f177d2f887dc13b07af21de08c4fcac/dist%2Fadvanced-search.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "9")[43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/ragesh-kr/plate/tree/e1344441ac307ea47549e48aea8aa53539ae6214/static%2Fjs%2Famsify.js?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054 "10")

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
