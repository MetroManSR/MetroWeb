import { defaultPendingChanges, updateUniversalPendingChanges, updatePendingChangesList, universalPendingChanges } from './initFormEventListeners.js';
import { UCurrentPage } from './processRows.js';
import { renderBox } from './boxes.js';
import { captureError } from './errorModule.js';

// Function to generate query string based on settings
export function generateQueryString(settings) {
    const params = new URLSearchParams();

    // Add only changed settings to the query string
    if (settings.searchTerm !== defaultPendingChanges.searchTerm) {
        params.append('searchTerm', settings.searchTerm);
    }
    if (settings.exactMatch !== defaultPendingChanges.exactMatch) {
        params.append('exactMatch', settings.exactMatch);
    }
    Object.keys(settings.searchIn).forEach(key => {
        if (settings.searchIn[key] !== defaultPendingChanges.searchIn[key]) {
            params.append(`searchIn[${key}]`, settings.searchIn[key]);
        }
    });
    if (settings.filters.length > 0) {
        params.append('filters', settings.filters.join(','));
    }
    if (settings.rowsPerPage !== defaultPendingChanges.rowsPerPage) {
        params.append('rowsPerPage', settings.rowsPerPage);
    }
    if (settings.sortOrder !== defaultPendingChanges.sortOrder) {
        params.append('sortOrder', settings.sortOrder);
    }
    Object.keys(settings.versionDisplay).forEach(key => {
        if (settings.versionDisplay[key] !== defaultPendingChanges.versionDisplay[key]) {
            params.append(`versionDisplay[${key}]`, settings.versionDisplay[key]);
        }
    });
    // Use UCurrentPage if currentPage is not in settings
    const currentPage = settings.currentPage !== undefined ? settings.currentPage : UCurrentPage;
    if (currentPage !== defaultPendingChanges.currentPage) {
        params.append('currentPage', currentPage);
    }

    return params.toString();
}

// Function to update URL based on settings
export function updateURL(settings) {
    const queryString = generateQueryString(settings);
    const newURL = `${window.location.pathname}?${queryString}`;
    window.history.pushState({}, '', newURL);
}

// Function to update query string based on callable triggers
export function updateQueryString() {
    const currentSettings = {
        searchTerm: universalPendingChanges.searchTerm,
        exactMatch: universalPendingChanges.exactMatch,
        searchIn: universalPendingChanges.searchIn,
        filters: universalPendingChanges.filters,
        rowsPerPage: universalPendingChanges.rowsPerPage,
        sortOrder: universalPendingChanges.sortOrder,
        versionDisplay: universalPendingChanges.versionDisplay,
        currentPage: universalPendingChanges.currentPage || UCurrentPage
    };

    // Update the URL with the current settings
    updateURL(currentSettings);
}

// Handle URL parameters
export async function initUrl(allRows, rowsPerPage, displayPage, currentPage, currentSortOrder) {
    try {
        const params = new URLSearchParams(window.location.search);
        const searchTerm = params.get('hypersearchterm');
        const wordID = params.get('wordid');
        const rootID = params.get('rootid');
        const wordSpecificTerm = params.get('wordSpecific');
        const rootSpecificTerm = params.get('rootSpecific');

        // Handle filters from URL
        const filters = params.get('filters');
        if (filters) {
            updateUniversalPendingChanges({ filters: filters.split(',') });
        }

        if (searchTerm && searchTerm.trim()) {
            const criteria = { searchTerm: searchTerm.trim(), searchIn: { word: true, root: true, definition: true, etymology: false } };
            console.log(`Processing search term: ${criteria.searchTerm}`);
            const filteredRows = allRows.filter(row => {
                const normalizedTitle = row.title.toLowerCase();
                const normalizedMeta = row.meta.toLowerCase();
                const normalizedMorph = row.morph.map(morphItem => morphItem.toLowerCase()).join(' ');

                return (criteria.searchIn.word && normalizedTitle.includes(criteria.searchTerm.toLowerCase())) ||
                       (criteria.searchIn.root && row.type === 'root' && normalizedTitle.includes(criteria.searchTerm.toLowerCase())) ||
                       (criteria.searchIn.definition && normalizedMeta.includes(criteria.searchTerm.toLowerCase())) ||
                       (criteria.searchIn.etymology && normalizedMorph.includes(criteria.searchTerm.toLowerCase()));
            });
            return filteredRows; // Return filtered rows based on search term
        } else if (wordID && parseInt(wordID) > 0) {
            const wordEntry = allRows.find(row => row.id === parseInt(wordID) && row.type === 'word');
            if (wordEntry) {
                console.log('Displaying word entry:', wordEntry);
                return [wordEntry]; // Return the word entry as an array
            } else {
                await captureError(`Word entry not found for ID: ${wordID}`);
                return false;
            }
        } else if (rootID && parseInt(rootID) > 0) {
            const rootEntry = allRows.find(row => row.id === parseInt(rootID) && row.type === 'root');
            if (rootEntry) {
                console.log('Displaying root entry:', rootEntry);
                return [rootEntry]; // Return the root entry as an array
            } else {
                await captureError(`Root entry not found for ID: ${rootID}`);
                return false;
            }
        } else if (wordSpecificTerm && wordSpecificTerm.trim()) {
            console.log(`Processing word specific term: ${wordSpecificTerm}`);
            const filteredRows = allRows.filter(row => row.title.toLowerCase().includes(wordSpecificTerm.toLowerCase()));
            return filteredRows; // Return filtered rows based on word specific term
        } else if (rootSpecificTerm && rootSpecificTerm.trim()) {
            console.log(`Processing root specific term: ${rootSpecificTerm}`);
            const filteredRows = allRows.filter(row => row.type === 'root' && row.title.toLowerCase().includes(rootSpecificTerm.toLowerCase()));
            return filteredRows; // Return filtered rows based on root specific term
        } else {
            await captureError('No valid URL parameters found.');
            return false;
        }
    } catch (error) {
        await captureError(`Error processing URL parameters: ${error.message}`);
        return false; // Signal that an error occurred
    }
}

// Update pending changes list based on document language
export async function updatePendingChangesListBasedOnLanguage() {
    const language = document.documentElement.lang;
    await updatePendingChangesList(language);
}
