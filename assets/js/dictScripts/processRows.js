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

let filteredRows = [];

/**
 * Adds a row to the filteredRows array if it's not already present.
 * @param {Object} row - The row to add.
 */
function addToFilteredRows(row) {
    if (!filteredRows.some(existingRow => existingRow.id === row.id)) {
        filteredRows.push(row);
    }
}

/**
 * Removes a row from the filteredRows array based on its ID.
 * @param {String} rowId - The ID of the row to remove.
 */
function removeFromFilteredRows(rowId) {
    filteredRows = filteredRows.filter(row => row.id !== rowId);
}

export async function processAllSettings(allRows = [], rowsPerPage = 20, currentPage = 1, sortingManner = 'titleup') {
    const params = universalPendingChanges || defaultPendingChanges;
    const language = document.querySelector('meta[name="language"]').content || 'en';

    const applySettingsButton = document.getElementById('dict-apply-settings-button');
    applySettingsButton.disabled = true;

    const { searchTerm, exactMatch, searchIn, filters, ignoreDiacritics, startsWith, endsWith, versionDisplay, languageOriginFilter } = params;

    const normalize = (text) => ignoreDiacritics ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;

    const normalizedLanguageOriginFilter = Array.isArray(languageOriginFilter) && languageOriginFilter.length > 0
        ? languageOriginFilter.map(language => normalize(language.toLowerCase()))
        : [];

    // Step 1: Preprocessing rows before final filtering
    const preProcessRows = Array.isArray(allRows) ? [...allRows] : [];

    // Reset filteredRows
    filteredRows = [];

    // Step 2: Apply all filters iteratively and modify filteredRows
    preProcessRows.forEach(row => {
        const normalizedTitle = normalize(row.title.toLowerCase());
        const normalizedMeta = normalize(row.meta.toLowerCase());

        // Search Term Filtering
        if (searchTerm && searchTerm.length > 0) {
            const terms = Array.isArray(searchTerm) ? searchTerm.map(term => normalize(term.toLowerCase())) : [normalize(searchTerm.toLowerCase())];

            const matchesTerm = terms.some(term => {
                return (
                    (searchIn.word && row.type === 'word' && (
                        (exactMatch && normalizedTitle === term) ||
                        (startsWith && normalizedTitle.startsWith(term)) ||
                        (endsWith && normalizedTitle.endsWith(term)) ||
                        (!exactMatch && !startsWith && !endsWith && normalizedTitle.includes(term))
                    )) ||
                    (searchIn.definition && (
                        (exactMatch && normalizedMeta === term) ||
                        (startsWith && normalizedMeta.startsWith(term)) ||
                        (endsWith && normalizedMeta.endsWith(term)) ||
                        (!exactMatch && !startsWith && !endsWith && normalizedMeta.includes(term))
                    ))
                );
            });

            if (!matchesTerm) {
                removeFromFilteredRows(row.id);
                return;
            }
        }

        // Filters based on part of speech
        if (filters.length > 0 && !filters.includes(row.partofspeech?.toLowerCase())) {
            removeFromFilteredRows(row.id);
            return;
        }

        // Version Display Filtering
        const mappedVersion = mapVersion(row.revision);
        if (!versionDisplay[mappedVersion]) {
            removeFromFilteredRows(row.id);
            return;
        }

        // Language Origin Filtering
        if (normalizedLanguageOriginFilter.length > 0) {
            if (row.revision === '25V2' && row.morph[0] && row.morph[0].originLanguages) {
                const matchesLanguageOrigin = row.morph[0].originLanguages.some(language => {
                    const normalizedLanguage = normalize(language.toLowerCase().replace(/\b(old|antiguo|middle|medio|vulgar|medieval|alto|high)\b/gi, '').trim());
                    return normalizedLanguageOriginFilter.includes(normalizedLanguage);
                });

                if (!matchesLanguageOrigin) {
                    removeFromFilteredRows(row.id);
                    return;
                }
            } else {
                removeFromFilteredRows(row.id);
                return;
            }
        }

        // Add the row to filteredRows if it passes all filters
        addToFilteredRows(row);
    });

    // Step 3: Sort filteredRows
    filteredRows = sortRows(filteredRows, sortingManner);

    // Step 4: Prepare rows for rendering
    filteredRows.forEach(row => {
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

    // Step 5: Render results
    updateFilteredRows(filteredRows);

    const totalRows = filteredRows.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    currentPage = Math.min(currentPage, totalPages);
    UCurrentPage = currentPage;

    const renderContainer = document.getElementById('dict-dictionary');
    if (renderContainer) {
        renderContainer.innerHTML = '';
        await renderBox(filteredRows, searchTerm, exactMatch, searchIn, rowsPerPage, currentPage);
        updatePagination(currentPage, rowsPerPage);
        await updateFloatingText(searchTerm, filters, searchIn, language, [exactMatch, ignoreDiacritics, startsWith, endsWith]);
    } else {
        await captureError("Error: 'dict-dictionary' element not found in the DOM.");
    }

    applySettingsButton.disabled = false;
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
