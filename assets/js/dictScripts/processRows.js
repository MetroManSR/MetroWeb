import { createPaginationControls, updatePagination } from './pagination.js';
import { renderBox, updateFloatingText } from './boxes.js';

/**
 * Filters and processes rows based on the provided criteria.
 *
 * @param {Array} allRows - The array of all dictionary rows.
 * @param {Object} criteria - The search and filter criteria.
 * @param {number} rowsPerPage - The number of rows to display per page.
 * @param {Function} displayPage - The function to display the page.
 * @param {number} [currentPage=1] - The current page to display.
 */
export function processRows(allRows, criteria, rowsPerPage, displayPage, currentPage = 1) {
    const {
        searchTerm = '',
        exactMatch = false,
        searchIn = { word: true, root: true, definition: false, etymology: false },
        filters = []
    } = criteria;

    let filteredRows = allRows;

    // Apply search term filtering
    if (searchTerm) {
        filteredRows = filteredRows.filter(row => {
            const wordMatch = searchIn.word && row.type === 'word' && (exactMatch ? row.word === searchTerm : row.word.toLowerCase().includes(searchTerm.toLowerCase()));
            const rootMatch = searchIn.root && row.type === 'root' && (exactMatch ? row.word === searchTerm : row.word.toLowerCase().includes(searchTerm.toLowerCase()));
            const definitionMatch = searchIn.definition && (exactMatch ? row.definition === searchTerm : row.definition.toLowerCase().includes(searchTerm.toLowerCase()));
            const etymologyMatch = searchIn.etymology && (exactMatch ? row.etymology === searchTerm : row.etymology.toLowerCase().includes(searchTerm.toLowerCase()));
            return wordMatch || rootMatch || definitionMatch || etymologyMatch;
        });
    }

    // Apply filter criteria
    if (filters.length > 0) {
        filteredRows = filteredRows.filter(row => filters.includes(row.type) || filters.includes(row.partOfSpeech?.toLowerCase()));
    }

    // Sort filtered rows alphabetically by word
    filteredRows.sort((a, b) => a.word.localeCompare(b.word));

    // Update pagination and render boxes
    createPaginationControls(rowsPerPage, filteredRows, currentPage, displayPage);
    renderBox(filteredRows, allRows, searchTerm, exactMatch, searchIn, rowsPerPage, currentPage);
    updateFloatingText(filteredRows, searchTerm, filters, searchIn);
}
