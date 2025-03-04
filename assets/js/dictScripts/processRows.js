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
    const params = universalPendingChanges || defaultPendingChanges;
    const language = document.querySelector('meta[name="language"]').content || 'en';

    const applySettingsButton = document.getElementById('dict-apply-settings-button');
    applySettingsButton.disabled = true;

    // Destructure parameters for easier handling
    const {
        searchTerm,
        exactMatch,
        searchIn,
        filters,
        rowsPerPage: rowsPerPageParam,
        sortOrder,
        versionDisplay
    } = params;

    const normalize = (text) => params.ignoreDiacritics 
        ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
        : text;

    const normalizedLanguageOriginFilter = Array.isArray(params.languageOriginFilter) && params.languageOriginFilter.length > 0
        ? params.languageOriginFilter.map(language => normalize(language.toLowerCase()))
        : [];

    // Use rowsPerPage and sortOrder from pendingChanges
    const perPage = rowsPerPageParam || rowsPerPage;
    const sortingManner = sortOrder || sortingManner;

    let tempFilteredRows = [];
    let preProcessRows = Array.isArray(allRows) ? [...allRows] : [];
    const foundTerms = {};

    // Apply search term filtering
    if (searchTerm && searchTerm.length > 0) {
        const terms = Array.isArray(searchTerm) 
            ? searchTerm.map(term => normalize(term.toLowerCase())) 
            : [normalize(searchTerm.toLowerCase())];
        terms.forEach(term => foundTerms[term] = []);

        preProcessRows = preProcessRows.filter(row => {
            const normalizedTitle = normalize(row.title.toLowerCase());
            const normalizedMeta = normalize(row.meta.toLowerCase());
            const normalizedMorph = row.morph.map(morphItem => typeof morphItem === 'string' ? normalize(morphItem.toLowerCase()) : morphItem);

            let termFound = false;

            terms.forEach(term => {
                const titleMatch = searchIn.word && row.type === 'word' && (
                    (exactMatch && normalizedTitle === term) ||
                    (params.startsWith && normalizedTitle.startsWith(term)) ||
                    (params.endsWith && normalizedTitle.endsWith(term)) ||
                    (!exactMatch && !params.startsWith && !params.endsWith && normalizedTitle.includes(term))
                );

                const rootMatch = searchIn.root && row.type === 'root' && (
                    (exactMatch && normalizedTitle === term) ||
                    (params.startsWith && normalizedTitle.startsWith(term)) ||
                    (params.endsWith && normalizedTitle.endsWith(term)) ||
                    (!exactMatch && !params.startsWith && !params.endsWith && normalizedTitle.includes(term))
                );

                const definitionMatch = searchIn.definition && (
                    (exactMatch && normalizedMeta === term) ||
                    (params.startsWith && normalizedMeta.startsWith(term)) ||
                    (params.endsWith && normalizedMeta.endsWith(term)) ||
                    (!exactMatch && !params.startsWith && !params.endsWith && normalizedMeta.includes(term))
                );

                let etymologyMatch = false;
                if (searchIn.etymology) {
                    if (row.revision === '25V2' && row.morph[0] && row.morph[0].originLanguages && row.morph[0].originWords) {
                        etymologyMatch = row.morph[0].originWords.some(item => (
                            (exactMatch && normalize(item).includes(term)) ||
                            (params.startsWith && normalize(item).startsWith(term)) ||
                            (params.endsWith && normalize(item).endsWith(term)) ||
                            (!exactMatch && !params.startsWith && !params.endsWith && normalize(item).includes(term))
                        ));
                    } else {
                        etymologyMatch = (
                            (exactMatch && normalizedMorph.includes(term)) ||
                            (params.startsWith && normalizedMorph.some(item => item.startsWith(term))) ||
                            (params.endsWith && normalizedMorph.some(item => item.endsWith(term))) ||
                            (!exactMatch && !params.startsWith && !params.endsWith && normalizedMorph.some(item => item.includes(term)))
                        );
                    }
                }

                if (titleMatch || rootMatch || definitionMatch || etymologyMatch) {
                    foundTerms[term].push(row);
                    termFound = true;
                }
            });

            return termFound;
        });

        Object.keys(foundTerms).forEach(term => {
            foundTerms[term] = sortRows(foundTerms[term], sortingManner);
        });
    }

    // Apply "Filter By" logic
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

    // Filter rows based on selected versionDisplay
    preProcessRows = preProcessRows.filter(row => {
        const mappedVersion = mapVersion(row.revision);
        const isDisplayed = versionDisplay[mappedVersion] || false;
        console.log(`Row ID: ${row.id}, Revision: ${row.revision}, Displayed: ${isDisplayed}`);
        return isDisplayed;
    });

    // Apply language origin filter
    if (normalizedLanguageOriginFilter.length > 0) {
        preProcessRows = preProcessRows.filter(row => {
            if (row.revision === '25V2' && row.morph[0] && row.morph[0].originLanguages) {
                const match = row.morph[0].originLanguages.some(language => {
                    const normalizedLanguage = normalize(language.toLowerCase().replace(/\b(old|antiguo|middle|medio|vulgar|medieval|alto|high)\b/gi, '').trim());
                    console.log(`Normalized Language: ${normalizedLanguage}, Match: ${normalizedLanguageOriginFilter.includes(normalizedLanguage)}`);
                    return normalizedLanguageOriginFilter.includes(normalizedLanguage);
                });
                return match;
            }
            return false;
        });
    }

    // Fill tempFilteredRows
    for (const row of preProcessRows) {
        if (!tempFilteredRows.some(existingRow => existingRow.id === row.id)) {
            await addRowToFilteredRows(row);
        }
    }

    // Sort rows
    tempFilteredRows = sortRows(tempFilteredRows, sortingManner);

    // Process morph dictionary for rendering
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

    // Update UI with tempFilteredRows
    updateFilteredRows(tempFilteredRows);

    const totalRows = tempFilteredRows.length;
    const totalPages = Math.ceil(totalRows / perPage);
    currentPage = Math.min(currentPage, totalPages);
    UCurrentPage = currentPage;

    const renderContainer = document.getElementById('dict-dictionary');
    if (renderContainer) {
        renderContainer.innerHTML = '';
        await renderBox(tempFilteredRows, searchTerm, exactMatch, searchIn, perPage, currentPage);
        updatePagination(currentPage, perPage);
        await updateFloatingText(searchTerm, filters, searchIn, language, [exactMatch, params.ignoreDiacritics, params.startsWith, params.endsWith]);
    } else {
        await captureError("Error: 'dict-dictionary' element not found in the DOM.");
    }

    applySettingsButton.disabled = false; // Re-enable the button after the process is complete
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
