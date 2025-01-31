import { createPaginationControls, updatePagination } from './pagination.js';
import { renderBox, updateFloatingText } from './boxes.js';
import { highlight } from './utils.js';
import { filteredRows, updateFilteredRows } from "../mainDict.js";
import { universalPendingChanges, defaultPendingChanges } from './initFormEventListeners.js';

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

    const { searchTerm, exactMatch, searchIn, filters, ignoreDiacritics, startsWith, endsWith } = params;

    const normalize = (text) => ignoreDiacritics ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;

    let updatedRows = Array.isArray(allRows) ? [...allRows] : [];

    if (searchTerm) {
        const term = normalize(searchTerm.toLowerCase());
        updatedRows = updatedRows.filter(row => {
            const normalizedTitle = normalize(row.title.toLowerCase());
            const normalizedMeta = normalize(row.meta.toLowerCase());
            const normalizedMorph = row.morph.map(morphItem => normalize(morphItem.toLowerCase()));

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
        if (!uniqueRows.some(uniqueRow => uniqueRow.id === row.id)) {
            uniqueRows.push(row);
        }
    });
    updatedRows = uniqueRows;

    // Sort rows
    updatedRows = sortRows(updatedRows, sortingManner);

    updateFilteredRows(updatedRows);

    const totalRows = updatedRows.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    currentPage = Math.min(currentPage, totalPages);

    const renderContainer = document.getElementById('dict-dictionary');
    if (renderContainer) {
        renderContainer.innerHTML = '';
        await renderBox(updatedRows, searchTerm, exactMatch, searchIn, rowsPerPage, currentPage);
        updatePagination(currentPage, rowsPerPage);
        await updateFloatingText(searchTerm, filters, searchIn);
    } else {
        console.error("Error: 'dict-dictionary' element not found in the DOM.");
    }

    applySettingsButton.disabled = false;
                 }
