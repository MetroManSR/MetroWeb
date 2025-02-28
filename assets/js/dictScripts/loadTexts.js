import { universalPendingChanges } from "./initFormEventListeners.js";
import { captureError } from "./errorModule.js";
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
        const searchInput = document.querySelector('.dict-search-input');
        if (searchInput) {
            searchInput.placeholder = currentTexts.searchPlaceholder;
        } else {
            captureError('Search input element not found');
        }

        const clearSearchButton = document.querySelector('.dict-clear-search-button');
        if (clearSearchButton) {
            clearSearchButton.textContent = currentTexts.clearSearchButton;
        } else {
            captureError('Clear search button element not found');
        }

        const rowsPerPageLabel = document.querySelector('#dct-rws-lbl');
        if (rowsPerPageLabel) {
            rowsPerPageLabel.textContent = currentTexts.rowsPerPageLabel;
        } else {
            captureError('Rows per page label element not found');
        }

        const applySettingsButton = document.querySelector('.dict-apply-settings-button');
        if (applySettingsButton) {
            applySettingsButton.textContent = currentTexts.applySettingsButton;
        } else {
            captureError('Apply settings button element not found');
        }

        const clearSettingsButton = document.querySelector('.dict-clear-settings-button');
        if (clearSettingsButton) {
            clearSettingsButton.textContent = currentTexts.clearSettingsButton;
        } else {
            captureError('Clear settings button element not found');
        }

        const advancedSearchButton = document.querySelector('.dict-advanced-search-button');
        if (advancedSearchButton) {
            advancedSearchButton.textContent = currentTexts.advancedSearchButton;
        } else {
            captureError('Advanced search button element not found');
        }

        const viewStatisticsButton = document.querySelector('.dict-view-statistics-button');
        if (viewStatisticsButton) {
            viewStatisticsButton.textContent = currentTexts.viewStatisticsButton;
        } else {
            captureError('View statistics button element not found');
        }

        const closePopupButton = document.querySelector('.dict-close-popup-button');
        if (closePopupButton) {
            closePopupButton.textContent = currentTexts.close;
        } else {
            console.error('Close popup button element not found');
        }

        const filterByLabel = document.querySelector('#dct-flt-by-lbl');
        if (filterByLabel) {
            filterByLabel.textContent = currentTexts.filterByLabel;
        } else {
            captureError('Filter by label element not found');
        }

        const orderByLabel = document.querySelector('#dct-ord-lbl');
        if (orderByLabel) {
            orderByLabel.textContent = currentTexts.orderByLabel;
        } else {
            captureError('Order by label element not found');
        }

        // Update the order by options text
        const orderBySelect = document.querySelector('#dct-ord-slt');
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
        } else {
            captureError('Order by select element not found');
        }

        // Update the filter dropdown options text
        const filterSelect = document.querySelector('#dct-wrd-flt');
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
        } else {
            captureError('Filter select element not found');
        }

            // Translations for Advanced Search Popup
    const advancedSearchTitle = await getTranslatedText('advancedSearchTitle', language);
    const addSearchText = await getTranslatedText('addSearch', language);
    const closeText = await getTranslatedText('close', language);
    const searchInWordText = await getTranslatedText('searchInWord', language);
    const searchInRootText = await getTranslatedText('searchInRoot', language);
    const searchInDefinitionText = await getTranslatedText('searchInDefinition', language);
    const searchInEtymologyText = await getTranslatedText('searchInEtymology', language);
    const exactMatchText = await getTranslatedText('exactMatch', language);
    const ignoreDiacriticsText = await getTranslatedText('ignoreDiacritics', language);
    const startsWithText = await getTranslatedText('startsWith', language);
    const endsWithText = await getTranslatedText('endsWith', language);

    // Update Advanced Search Popup elements
    document.querySelector('.dict-popup-content h3').textContent = advancedSearchTitle;
    document.querySelector('#dict-add-search-btn-popup').textContent = addSearchText;
    document.querySelector('label[for="dict-search-in-word"]').textContent = searchInWordText;
    document.querySelector('label[for="dict-search-in-root"]').textContent = searchInRootText;
    document.querySelector('label[for="dict-search-in-definition"]').textContent = searchInDefinitionText;
    document.querySelector('label[for="dict-search-in-etymology"]').textContent = searchInEtymologyText;
    document.querySelector('label[for="dict-exact-match"]').textContent = exactMatchText;
    document.querySelector('label[for="dict-ignore-diacritics"]').textContent = ignoreDiacriticsText;
    document.querySelector('label[for="dict-starts-with"]').textContent = startsWithText;
    document.querySelector('label[for="dict-ends-with"]').textContent = endsWithText;

        // Apply other labels as required
        const loadingMessageText = document.querySelector('.dict-loading-message-text');
        if (loadingMessageText) {
            loadingMessageText.textContent = currentTexts.loadingMessage;
        } else {
            captureError('Loading message text element not found');
        }

        const errorMessage = document.querySelector('.dict-error-message');
        if (errorMessage) {
            errorMessage.textContent = currentTexts.errorLoadingData;
        } else {
            captureError('Error message element not found');
        }

        // Pending Changes Section
        const pendingChangesElement = document.querySelector('.dict-pending-changes');
        if (pendingChangesElement && universalPendingChanges) {
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
        } else {
            captureError('Pending changes element not found');
        }
    } catch (error) {
        captureError('Error loading texts:', error);
    }
} 

export async function getTranslatedText(key, language, filePath = '/assets/data/defaultTexts.json') {
    try {
        const response = await fetch(filePath);
        const texts = await response.json();
        const defaultTexts = texts[language] || texts['en'];
        return defaultTexts[key];
    } catch (error) {
        captureError('Error fetching translated text:', error);
        return key; // Return the key as fallback
    }
            }
