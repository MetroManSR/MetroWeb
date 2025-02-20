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


/**
 * Processes all settings and updates the UI.
 * @param {Array} allRows - The array of all rows.
 * @param {Number} rowsPerPage - The number of rows per page.
 * @param {Number} currentPage - The current page number.
 * @param {String} sortingManner - The sorting manner.
 */
export async function processAllSettings(allRows = [], rowsPerPage = 20, currentPage = 1, sortingManner = 'titleup') {
    const params = universalPendingChanges || defaultPendingChanges;
    const language = document.querySelector('meta[name="language"]').content || 'en';

    const applySettingsButton = document.getElementById('dict-apply-settings-button');
    applySettingsButton.disabled = true;

    const { searchTerm, exactMatch, searchIn, filters, ignoreDiacritics, startsWith, endsWith, versionDisplay, languageOriginFilter } = params;

    const normalize = (text) => ignoreDiacritics ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;

    let updatedRows = Array.isArray(allRows) ? [...allRows] : [];
    const foundTerms = {};

    // Apply search term filtering first
    if (searchTerm && searchTerm.length > 0) {
        const terms = Array.isArray(searchTerm) ? searchTerm.map(term => normalize(term.toLowerCase())) : [normalize(searchTerm.toLowerCase())];
        terms.forEach(term => foundTerms[term] = []);

        updatedRows = updatedRows.filter(row => {
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

                let etymologyMatch = false;
                if (searchIn.etymology) {
                    if (row.revision === '25V2' && row.morph[0] && row.morph[0].originLanguages && row.morph[0].originWords) {
                        // New dictionary format (25V2)
                        etymologyMatch = row.morph[0].originWords.some(item => (
                            (exactMatch && normalize(item).includes(term)) ||
                            (startsWith && normalize(item).startsWith(term)) ||
                            (endsWith && normalize(item).endsWith(term)) ||
                            (!exactMatch && !startsWith && !endsWith && normalize(item).includes(term))
                        ));
                    } else {
                        // Old dictionary format or word format
                        etymologyMatch = (
                            (exactMatch && normalizedMorph.includes(term)) ||
                            (startsWith && normalizedMorph.some(item => item.startsWith(term))) ||
                            (endsWith && normalizedMorph.some(item => item.endsWith(term))) ||
                            (!exactMatch && !startsWith && !endsWith && normalizedMorph.some(item => item.includes(term)))
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

        // Sort the found terms for each search term
        Object.keys(foundTerms).forEach(term => {
            foundTerms[term] = sortRows(foundTerms[term], sortingManner);
        });
    }

    // Apply part of speech and type filtering
    if (filters.length > 0) {
        updatedRows = updatedRows.filter(row => filters.includes(row.partofspeech?.toLowerCase()));
    }

    // Filter rows based on selected versionDisplay
    if (versionDisplay) {
        updatedRows = updatedRows.filter(row => versionDisplay[mapVersion(row.revision)] || false);
    }

    // Filter rows based on selected languageOriginFilter
    if (Array.isArray(languageOriginFilter) && languageOriginFilter.length > 0) {
        console.log("Applying language origin filter:", languageOriginFilter);
        updatedRows = updatedRows.filter(row => {
            if (row.revision === '25V2' && row.morph[0] && row.morph[0].originLanguages) {
                // New dictionary format (25V2)
                const match = row.morph[0].originLanguages.some(language => {
                    const normalizedLanguage = normalize(language.toLowerCase().replace(/\b(old|antiguo|middle|medio|vulgar|medieval|alto|high)\b/gi, '').trim());
                    const isMatch = languageOriginFilter.includes(normalizedLanguage);
                    console.log(`Checking language: ${normalizedLanguage}, Match: ${isMatch}`);
                    return isMatch;
                });
                console.log(`Row ${row.id} match: ${match}`);
                return match;
            }
            return false;
        });
    }

    // Ensure unique rows
    const uniqueRows = [];
    updatedRows.forEach(row => {
        if (!uniqueRows.some(uniqueRow => uniqueRow.id === row.id)) {
            uniqueRows.push(row);
        }
    });
    updatedRows = uniqueRows;

    // Sort rows
    updatedRows = sortRows(updatedRows, sortingManner);

    // Update filteredRows to include morph dictionary processing
    updatedRows.forEach(row => {
        if (row.revision === '25V2' && row.morph[0] && row.morph[0].originLanguages && row.morph[0].originWords) {
            // New dictionary format (25V2)
            row.morphHtml = row.morph[0].originWords.map((word, index) => {
                const language = row.morph[0].originLanguages[index];
                const romanized = row.morph[0].originRomanizations[index] ? `<sup style="color: gray;">${row.morph[0].originRomanizations[index]}</sup>` : '';
                return `${language}: ${word} ${romanized}`;
            }).join(', ');
        } else {
            row.morphHtml = row.morph.join(', ');
        }
    });

    updateFilteredRows(updatedRows);

    const totalRows = updatedRows.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    currentPage = Math.min(currentPage, totalPages);
    UCurrentPage = currentPage;
    
    const renderContainer = document.getElementById('dict-dictionary');
    if (renderContainer) {
        renderContainer.innerHTML = '';
        await renderBox(updatedRows, searchTerm, exactMatch, searchIn, rowsPerPage, currentPage);
        updatePagination(currentPage, rowsPerPage);
        await updateFloatingText(searchTerm, filters, searchIn, language, [exactMatch, ignoreDiacritics, startsWith, endsWith]);
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
