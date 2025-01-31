import { createPaginationControls, updatePagination } from './pagination.js';
import { renderBox, updateFloatingText, createDictionaryBox, createNoMatchBox } from './boxes.js';
import { highlight } from './utils.js';
import { filteredRows, updateFilteredRows } from "../mainDict.js";
import { universalPendingChanges, defaultPendingChanges } from './initFormEventListeners.js';

/**
 * Sorts rows based on the specified sorting manner.
 *
 * @param {Array} rows - The array of rows to sort.
 * @param {String} sortingManner - The manner of sorting (e.g., "titleup", "titledown", "metaup", "metadown", "morphup", "morphdown").
 * @returns {Array} - The sorted array of rows.
 */
export function sortRows(rows, sortingManner) {
    if (!Array.isArray(rows)) {
        throw new TypeError('Expected an array of rows');
    }

    switch (sortingManner) {
        case 'titleup':
            return [...rows].sort((a, b) => a.title.localeCompare(b.title));
        case 'titledown':
            return [...rows].sort((a, b) => b.title.localeCompare(a.title));
        case 'metaup':
            return [...rows].sort((a, b) => (a.meta || '').localeCompare(b.meta || ''));
        case 'metadown':
            return [...rows].sort((a, b) => (b.meta || '').localeCompare(a.meta || ''));
        case 'morphup':
            return [...rows].sort((a, b) => {
                const morphA = Array.isArray(a.morph) ? a.morph.join(' ') : a.morph || '';
                const morphB = Array.isArray(b.morph) ? b.morph.join(' ') : b.morph || '';
                return morphA.localeCompare(morphB);
            });
        case 'morphdown':
            return [...rows].sort((a, b) => {
                const morphA = Array.isArray(a.morph) ? a.morph.join(' ') : a.morph || '';
                const morphB = Array.isArray(b.morph) ? b.morph.join(' ') : b.morph || '';
                return morphB.localeCompare(morphA);
            });
        case 'titleLengthUp': // Sort by title length (ascending)
            return [...rows].sort((a, b) => a.title.length - b.title.length);
        case 'titleLengthDown': // Sort by title length (descending)
            return [...rows].sort((a, b) => b.title.length - a.title.length);
        case 'metaLengthUp': // Sort by meta length (ascending)
            return [...rows].sort((a, b) => {
                const metaA = (a.meta || '').length; // Handle undefined/null meta
                const metaB = (b.meta || '').length;
                return metaA - metaB; // Shortest first
            });
        case 'metaLengthDown': // Sort by meta length (descending)
            return [...rows].sort((a, b) => {
                const metaA = (a.meta || '').length;
                const metaB = (b.meta || '').length;
                return metaB - metaA; // Longest first
            });
        default:
            return [...rows].sort((a, b) => a.title.localeCompare(b.title));
    }
}

/**
 * Checks if a row is unique based on its ID.
 *
 * @param {Object} row - The row to check.
 * @param {Array} existingRows - The array of existing rows.
 * @returns {boolean} - True if the row is unique, false otherwise.
 */
function isUniqueResult(row, existingRows) {
    return !existingRows.some(existingRow => existingRow.id === row.id);
}

export async function processAllSettings(allRows = [], rowsPerPage = 20, currentPage = 1, sortingManner = 'titleup') {
    let params = universalPendingChanges ? universalPendingChanges : defaultPendingChanges;
    const language = document.querySelector('meta[name="language"]').content || 'en'; // Default to 'en' if not specified

    const applySettingsButton = document.getElementById('dict-apply-settings-button');
    applySettingsButton.disabled = true; // Disable the button

    const {
        searchTerm,
        exactMatch,
        searchIn,
        filters,
        ignoreDiacritics,
        startsWith,
        endsWith
    } = params;

    const normalize = (text) => ignoreDiacritics ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;

    let updatedRows = Array.isArray(allRows) ? [...allRows] : [];

    if (searchTerm) {
        updatedRows = updatedRows.filter(row => {
            const normalizedTitle = normalize(row.title.toLowerCase());
            const normalizedMeta = normalize(row.meta.toLowerCase());
            const normalizedMorph = row.morph.map(morphItem => normalize(morphItem.toLowerCase()));
            const term = normalize(searchTerm.toLowerCase());

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

            const etymologyMatch = searchIn.etymology && (
                (exactMatch && normalizedMorph.includes(term)) ||
                (startsWith && normalizedMorph.some(item => item.startsWith(term))) ||
                (endsWith && normalizedMorph.some(item => item.endsWith(term))) ||
                (!exactMatch && !startsWith && !endsWith && normalizedMorph.some(item => item.includes(term)))
            );

            return titleMatch || rootMatch || definitionMatch || etymologyMatch;
        });
    }

    if (filters.length > 0) {
        updatedRows = updatedRows.filter(row => filters.includes(row.partofspeech?.toLowerCase()));
    }

    // Remove duplicates
    const uniqueRows = [];
    updatedRows.forEach(row => {
        if (isUniqueResult(row, uniqueRows)) {
            uniqueRows.push(row);
        }
    });
    updatedRows = uniqueRows;

    // Sort rows based on the sortingManner from pendingChanges
    updatedRows = sortRows(updatedRows, sortingManner);

    updateFilteredRows(updatedRows);

    const totalRows = updatedRows.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    currentPage = Math.min(currentPage, totalPages);
    console.log(`Total rows: ${totalRows}, Total pages: ${totalPages}, Current page: ${currentPage}`);

    const renderContainer = document.getElementById('dict-dictionary');
    if (renderContainer) {
        renderContainer.innerHTML = '';
    } else {
        console.error("Error: 'dict-dictionary' element not found in the DOM.");
        applySettingsButton.disabled = false; // Re-enable the button if there's an error
        return;
    }

    await renderBox(updatedRows, searchTerm, exactMatch, searchIn, rowsPerPage, currentPage);
    updatePagination(currentPage, rowsPerPage);
    await updateFloatingText(searchTerm, filters, searchIn);

    const settingsAppliedText = document.createElement('div');
    settingsAppliedText.id = 'settings-applied-text';
    settingsAppliedText.innerText = 'Settings Applied';
    settingsAppliedText.style.color = 'green';
    settingsAppliedText.style.fontWeight = 'bold';
    document.body.appendChild(settingsAppliedText);

    setTimeout(() => {
        settingsAppliedText.remove();
    }, 1000);

    applySettingsButton.disabled = false; // Re-enable the button after the process is complete

    console.log('Process complete.');
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
