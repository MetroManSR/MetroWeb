import { createPaginationControls, updatePagination } from './pagination.js';
import { renderBox, updateFloatingText } from './boxes.js';
import { highlight } from './utils.js';
import { filteredRows, updateFilteredRows } from "../mainDict.js";
import { universalPendingChanges, defaultPendingChanges } from './initFormEventListeners.js';
import { captureError } from './errorModule.js';

export let UCurrentPage = 1;

function mapVersion(originalVersion) {
    const versionMap = {
        '' : 'NR', 
        'Version NR' : 'NR', 
        '22OV': 'OV22',
        '24NV': 'NV24',
        '25NV': 'NV25',
        '25V2': 'V225'
    };
    return versionMap[originalVersion] || originalVersion;
}

/**
 * Sorts rows based on the specified sorting manner.
 * @param {Array} rows - The array of rows to sort.
 * @param {String} sortingManner - The manner of sorting.
 * @returns {Array} - The sorted array of rows.
 */
export function sortRows(rows, sortingManner) {
    if (!Array.isArray(rows)) {
        throw new TypeError('Expected an array of rows');
    }

    const sortFunctions = {
        titleup: (a, b) => a.title.localeCompare(b.title),
        titledown: (a, b) => b.title.localeCompare(a.title),
        metaup: (a, b) => (a.meta || '').localeCompare(b.meta || ''),
        metadown: (a, b) => (b.meta || '').localeCompare(a.meta || ''),
        morphup: (a, b) => (Array.isArray(a.morph) ? a.morph.join(' ') : a.morph || '').localeCompare(Array.isArray(b.morph) ? b.morph.join(' ') : b.morph || ''),
        morphdown: (a, b) => (Array.isArray(b.morph) ? b.morph.join(' ') : b.morph || '').localeCompare(Array.isArray(a.morph) ? a.morph.join(' ') : a.morph || ''),
        titleLengthUp: (a, b) => a.title.length - b.title.length,
        titleLengthDown: (a, b) => b.title.length - a.title.length,
        metaLengthUp: (a, b) => (a.meta || '').length - (b.meta || '').length,
        metaLengthDown: (a, b) => (b.meta || '').length - (a.meta || '').length,
    };

    return [...rows].sort(sortFunctions[sortingManner] || sortFunctions.titleup);
} 

let tempFilteredRows = []; // Declare outside of the function for global management

/**
 * Adds a row to tempFilteredRows if it doesn't already exist.
 * @param {Object} row - The row to add.
 */
async function addRowToFilteredRows(row) {
    if (!tempFilteredRows.some(existingRow => existingRow.id === row.id)) {
        tempFilteredRows.push(row);
    }
}

/**
 * Removes a row from tempFilteredRows if it exists.
 * @param {String} rowId - The ID of the row to remove.
 */
async function removeRowFromFilteredRows(rowId) {
    tempFilteredRows = tempFilteredRows.filter(row => row.id !== rowId);
}

export async function processAllSettings(allRows = [], rowsPerPage = 20, currentPage = 1, sortingManner = 'titleup') {
    // Initialize pendingChanges with fallback
    const pendingChanges = universalPendingChanges || defaultPendingChanges;

    // Extract parameters with fallback
    const searchTerm = pendingChanges.searchTerm ?? '';
    const exactMatch = pendingChanges.exactMatch ?? false;
    const searchIn = pendingChanges.searchIn ?? {
        word: true,
        root: true,
        definition: true,
        etymology: false
    };
    const filters = pendingChanges.filters ?? [];
    const rowsPerPageParam = pendingChanges.rowsPerPage ?? rowsPerPage;
    const sortOrder = pendingChanges.sortOrder ?? sortingManner;
    const versionDisplay = pendingChanges.versionDisplay ?? {
        NR: true,
        OV22: true,
        NV24: true,
        NV25: true,
        V225: true
    };
    const ignoreDiacritics = pendingChanges.ignoreDiacritics ?? false;
    const startsWith = pendingChanges.startsWith ?? false;
    const endsWith = pendingChanges.endsWith ?? false;
    const languageOriginFilter = pendingChanges.languageOriginFilter ?? [];

    const language = document.querySelector('meta[name="language"]').content || 'en'; // Detects the current language from meta tags

    // Function to normalize text for consistent comparisons (handles diacritics)
    const normalize = (text) => ignoreDiacritics 
        ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
        : text;

    // Normalize the list of origin languages for filtering
    const normalizedLanguageOriginFilter = Array.isArray(languageOriginFilter) && languageOriginFilter.length > 0
        ? languageOriginFilter.map(language => normalize(language.toLowerCase()))
        : [];

    let tempFilteredRows = []; // Temporary array to store filtered rows
    let preProcessRows = Array.isArray(allRows) ? [...allRows] : []; // Create a copy of the input rows for processing
    const foundTerms = {}; // Object to store rows matching search terms

    // Step 1: Handle searchTerm and check if it's a valid numeric ID

    if (searchTerm !== "" && !isNaN(searchTerm) && Number.isInteger(Number(searchTerm))) {
    // If searchTerm is not empty and is a valid integer, proceed with numeric search
    
        const numericSearchTerm = Number(searchTerm); // Convert searchTerm to a number

    // Find the maximum ID among rows of type 'word'
    const maxWordId = Math.max(...allRows.filter(row => row.type === 'word').map(row => row.id));

    if (numericSearchTerm <= maxWordId) {
        console.log(`Searching by ID: ${numericSearchTerm}`);
        preProcessRows = preProcessRows.filter(row => row.id === numericSearchTerm && row.type === 'word');
    } else {
        console.log(`Search ID ${numericSearchTerm} exceeds maximum 'word' ID (${maxWordId}).`);
        preProcessRows = []; // No matches if the ID exceeds the maximum
    }
} else if (searchTerm.length > 0) {
    // Proceed with standard search if searchTerm is not numeric
    const terms = Array.isArray(searchTerm) 
        ? searchTerm.map(term => normalize(term.toLowerCase())) 
        : [normalize(searchTerm.toLowerCase())];
    terms.forEach(term => foundTerms[term] = []); // Initialize storage for matches

    preProcessRows = preProcessRows.filter(row => {
        const normalizedTitle = normalize(row.title.toLowerCase());
        const normalizedMeta = normalize(row.meta.toLowerCase());
        const normalizedMorph = row.morph.map(morphItem => typeof morphItem === 'string' ? normalize(morphItem.toLowerCase()) : morphItem);

        let termFound = false;

        terms.forEach(term => {
            const titleMatch = searchIn.word && row.type === 'word' && (
                (exactMatch && normalizedTitle === term) ||
                (startsWith && normalizedTitle.startsWith(term)) ||
                (endsWith && normalizedTitle.endsWith(term)) ||
                (!exactMatch && !startsWith && !endsWith && normalizedTitle.includes(term))
            );

            const rootMatch = searchIn.root && row.type === 'root' && (
                (exactMatch && normalizedTitle === term) ||
                (startsWith && normalizedTitle.startsWith(term)) ||
                (endsWith && normalizedTitle.endsWith(term)) ||
                (!exactMatch && !startsWith && !endsWith && normalizedTitle.includes(term))
            );

            const definitionMatch = searchIn.definition && (
                (exactMatch && normalizedMeta === term) ||
                (startsWith && normalizedMeta.startsWith(term)) ||
                (endsWith && normalizedMeta.endsWith(term)) ||
                (!exactMatch && !startsWith && !endsWith && normalizedMeta.includes(term))
            );

            let etymologyMatch = false; // Initialize etymologyMatch as false

if (searchIn.etymology) {
    // Check if the revision is '25V2' and if morph data contains origin languages and words
    if (row.revision === '25V2' && row.morph[0] && row.morph[0].originLanguages && row.morph[0].originWords) {
        // Match search terms within origin words
        etymologyMatch = row.morph[0].originWords.some(item => (
            (exactMatch && normalize(item).includes(term)) || // Exact match
            (startsWith && normalize(item).startsWith(term)) || // Starts with
            (endsWith && normalize(item).endsWith(term)) || // Ends with
            (!exactMatch && !startsWith && !endsWith && normalize(item).includes(term)) // Partial match
        ));
    } else {
        // Handle simpler morph data for other revisions
        etymologyMatch = (
            (exactMatch && normalizedMorph.includes(term)) ||
            (startsWith && normalizedMorph.some(item => item.startsWith(term))) ||
            (endsWith && normalizedMorph.some(item => item.endsWith(term))) ||
            (!exactMatch && !startsWith && !endsWith && normalizedMorph.some(item => item.includes(term)))
        );
    }
}

// If any match condition is true, mark the term as found
if (titleMatch || rootMatch || definitionMatch || etymologyMatch) {
    foundTerms[term].push(row); // Add the matching row to the foundTerms object
    termFound = true; // Mark the row as a match for this term
}

    // Step 2: Apply filters based on the "Filter By" options
    const validFilterOptions = [
        "word", "root", "noun", "verb", "adjective", "adverb",
        "conjunction", "interjection", "preposition", "expression", "pronoun"
    ];

    if (filters.length > 0) {
        preProcessRows = preProcessRows.filter(row => {
            const rowType = row.type?.toLowerCase();
            const rowPartOfSpeech = row.partofspeech?.toLowerCase();

            // Check if the row matches any valid filter type or part of speech
            return validFilterOptions.some(option => rowType === option || rowPartOfSpeech === option);
        });
    }

    // Step 3: Filter rows based on the selected versions
    preProcessRows = preProcessRows.filter(row => {
        const mappedVersion = mapVersion(row.revision);
        const isDisplayed = versionDisplay[mappedVersion] || false;
        return isDisplayed;
    });

    // Step 4: Apply the language origin filter
    if (normalizedLanguageOriginFilter.length > 0) {
        preProcessRows = preProcessRows.filter(row => {
            if (row.revision === '25V2' && row.morph[0] && row.morph[0].originLanguages) {
                return row.morph[0].originLanguages.some(language => {
                    const normalizedLanguage = normalize(language.toLowerCase().replace(/\b(old|antiguo|middle|medio|vulgar|medieval|alto|high)\b/gi, '').trim());
                    return normalizedLanguageOriginFilter.includes(normalizedLanguage);
                });
            }
            return false;
        });
    }

    // Step 5: Populate tempFilteredRows with the final rows
    for (const row of preProcessRows) {
        if (!tempFilteredRows.some(existingRow => existingRow.id === row.id)) {
            await addRowToFilteredRows(row);
        }
    }

    // Step 6: Sort the final rows
    tempFilteredRows = sortRows(tempFilteredRows, sortOrder);

    // Step 7: Process morph data for rendering in the UI
    tempFilteredRows.forEach(row => {
        if (row.revision === '25V2' && row.morph[0] && row.morph[0].originLanguages && row.morph[0].originWords) {
            row.morphHtml = row.morph[0].originWords.map((word, index) => {
                const language = row.morph[0].originLanguages[index];
                const romanized = row.morph[0].originRomanizations[index] ? `<sup style="color: gray;">${row.morph[0].originRomanizations[index]}</sup>` : '';
                return `${language}: ${word} ${romanized}`;
            }).join(', ');
        } else {
            row.morphHtml = row.morph.join(', ');
        }
    });

    // Step 8: Update the UI with filtered rows and handle pagination
    const totalRows = tempFilteredRows.length; // Calculate the total number of rows after filtering
    const totalPages = Math.ceil(totalRows / rowsPerPageParam); // Calculate the total number of pages
    currentPage = Math.min(currentPage, totalPages); // Ensure the current page is within range
    UCurrentPage = currentPage; // Store the updated current page globally

    // Find the container for rendering rows in the DOM
    const renderContainer = document.getElementById('dict-dictionary');
    if (renderContainer) {
        renderContainer.innerHTML = ''; // Clear previous content
        // Render the rows for the current page
        await renderBox(tempFilteredRows, searchTerm, exactMatch, searchIn, rowsPerPageParam, currentPage);
        // Update pagination UI
        updatePagination(currentPage, rowsPerPageParam);
        // Update the floating text for visual feedback (e.g., displaying filters and search info)
        await updateFloatingText(searchTerm, filters, searchIn, language, [exactMatch, ignoreDiacritics, startsWith, endsWith]);
    } else {
        // Log an error if the container is not found in the DOM
        await captureError("Error: 'dict-dictionary' element not found in the DOM.");
    }

    // Step 9: Re-enable the "Apply Settings" button to allow further interactions
    const applySettingsButton = document.getElementById('dict-apply-settings-button'); // Select the Apply Settings button from the DOM
    
    applySettingsButton.disabled = false; // Enable the button after processing is complete
}


/**
 * Displays the specified page of results.
 *
 * @param {number} page - The page number to display.
 * @param {number} rowsPerPage - The number of rows to display per page.
 * @param {string} searchTerm - The search term used to filter results.
 * @param {Object} searchIn - An object specifying which fields to search in.
 * @param {boolean} exactMatch - Whether to search for exact matches.
 * @param {Array} filteredRows - The filtered array of dictionary entries.
 * @param {Array} allRows - The array of all dictionary entries.
 */
export function displayPage(page, rowsPerPage, searchTerm = '', searchIn = { word: true, root: true, definition: false, etymology: false }, exactMatch = false, allRows = []) {
    //console.log('Displaying page:', page);
    renderBox(allRows, searchTerm, exactMatch, searchIn, rowsPerPage, page);
}

/**
 * Handles the rows per page customization.
 *
 * @param {Event} e - The event object.
 */
export function handleRowsPerPageChange(e) {
    const rowsPerPage = parseInt(e.target.value, 10);
    if (!isNaN(rowsPerPage) && rowsPerPage > 0) {
        pendingChanges.rowsPerPage = rowsPerPage;
    }
}

function splitArrayIntoChunks(array, chunkSize) {
    let result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        let chunk = array.slice(i, i + chunkSize);
        result.push(chunk);
    }
    return result;
}
