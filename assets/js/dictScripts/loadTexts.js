import { universalPendingChanges } from "./initFormEventListeners.js";

export async function fetchJson(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
    }
    return response.json();
}

export async function setTexts(language) {
    const pendingChanges = universalPendingChanges;

    try {
        const response = await fetch('/assets/data/defaultTexts.json');
        const texts = await response.json();

        const currentTexts = texts[language] || texts['en'];

        // Update search-related elements
        document.querySelector('.dict-search-input').placeholder = currentTexts.searchPlaceholder;
        document.querySelector('.dict-clear-search-button').textContent = currentTexts.clearSearchButton;
        document.querySelector('.dct-rws-lbl').textContent = currentTexts.rowsPerPageLabel;
        document.querySelector('.dct-tgl-flt-btn').textContent = currentTexts.toggleFiltersButton;
        document.querySelector('.dict-apply-settings-button').textContent = currentTexts.applySettingsButton;
        document.querySelector('.dict-clear-settings-button').textContent = currentTexts.clearSettingsButton;
        document.querySelector('.dict-advanced-search-button').textContent = currentTexts.advancedSearchButton;
        document.querySelector('.dict-view-statistics-button').textContent = currentTexts.viewStatisticsButton;
        document.querySelector('.dict-close-popup-button').textContent = currentTexts.close;
        document.querySelector('.dct-flt-by-lbl').textContent = currentTexts.filterByLabel;
        document.querySelector('.dct-ord-lbl').textContent = currentTexts.orderByLabel;

        // Update the order by options text
        const orderBySelect = document.querySelector('.dct-ord-slt');
        if (orderBySelect) {
            orderBySelect.options[0].textContent = currentTexts.titleup;
            orderBySelect.options[1].textContent = currentTexts.titledown;
            orderBySelect.options[2].textContent = currentTexts.metaup;
            orderBySelect.options[3].textContent = currentTexts.metadown;
            orderBySelect.options[4].textContent = currentTexts.morphup;
            orderBySelect.options[5].textContent = currentTexts.morphdown;
            orderBySelect.options[6].textContent = currentTexts.titleLengthUp;
            orderBySelect.options[7].textContent = currentTexts.titleLengthDown;
            orderBySelect.options[8].textContent = currentTexts.metaLengthUp;
            orderBySelect.options[9].textContent = currentTexts.metaLengthDown;
        }

        // Update the filter dropdown options text
        const filterSelect = document.querySelector('.dct-wrd-flt');
        if (filterSelect) {
            filterSelect.options[0].textContent = currentTexts.searchInWord;
            filterSelect.options[1].textContent = currentTexts.searchInRoot;
            filterSelect.options[2].textContent = currentTexts.noun;
            filterSelect.options[3].textContent = currentTexts.verb;
            filterSelect.options[4].textContent = currentTexts.adjective;
            filterSelect.options[5].textContent = currentTexts.adverb;
            filterSelect.options[6].textContent = currentTexts.conjunction;
            filterSelect.options[7].textContent = currentTexts.interjection;
            filterSelect.options[8].textContent = currentTexts.preposition;
            filterSelect.options[9].textContent = currentTexts.expression;
            filterSelect.options[10].textContent = currentTexts.pronoun;
        }

        // Update texts for new filters
        document.querySelector('.dct-igr-dct-lbl').textContent = currentTexts.ignoreDiacritics;
        document.querySelector('.dct-str-wth-lbl').textContent = currentTexts.startsWith;
        document.querySelector('.dct-end-wth-lbl').textContent = currentTexts.endsWith;

        // Apply other labels as required
        document.querySelector('.dict-loading-message-text').textContent = currentTexts.loadingMessage;
        document.querySelector('.dict-error-message').textContent = currentTexts.errorLoadingData;

        // Pending Changes Section
        const pendingChangesElement = document.querySelector('.dict-pending-changes');
        if (pendingChangesElement) {
            pendingChangesElement.innerHTML = `
                <p>${currentTexts.pendingChanges}</p>
                <p>${currentTexts.noPendingChanges}</p>
                <ul>
                    <li><strong>${currentTexts.searchTerm}:</strong> ${pendingChanges.searchTerm}</li>
                    <li><strong>${currentTexts.exactMatch}:</strong> ${pendingChanges.exactMatch}</li>
                    <li><strong>${currentTexts.filters}:</strong> ${pendingChanges.filters.join(', ')}</li>
                    <li><strong>${currentTexts.ignoreDiacritics}:</strong> ${pendingChanges.ignoreDiacritics}</li>
                    <li><strong>${currentTexts.startsWith}:</strong> ${pendingChanges.startsWith}</li>
                    <li><strong>${currentTexts.endsWith}:</strong> ${pendingChanges.endsWith}</li>
                    <li><strong>${currentTexts.sortOrder}:</strong> ${pendingChanges.sortOrder}</li>
                    <li><strong>${currentTexts.rowsPerPage}:</strong> ${pendingChanges.rowsPerPage}</li>
                </ul>
            `;
        }
    } catch (error) {
        console.error('Error loading texts:', error);
    }
}

export async function getTranslatedText(key, language, filePath = '/assets/data/defaultTexts.json') {
    try {
        const response = await fetch(filePath);
        const texts = await response.json();
        const defaultTexts = texts[language] || texts['en'];
        return defaultTexts[key];
    } catch (error) {
        console.error('Error fetching translated text:', error);
        return key; // Return the key as fallback
    }
            }
