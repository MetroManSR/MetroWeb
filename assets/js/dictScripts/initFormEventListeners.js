import { getTranslatedText } from './loadTexts.js';
import { highlight, getSimilarity } from './utils.js';
import { initAdvancedSearchPopup } from './popups.js';
import { processAllSettings } from './processRows.js';
export const defaultPendingChanges = {
    searchTerm: '',
    exactMatch: false,
    searchIn: {
        word: true,
        root: true,
        definition: true,
        etymology: false
    },
    filters: [],
    rowsPerPage: 20,
    sortOrder: 'titleup', // Default sort order
    versionDisplay: {
        NR: true,
        OV22: true, 
        NV24: true, 
        NV25: true, 
        V225: true
    
    }
   
};

export let universalPendingChanges;

export async function updatePendingChangesList(language) {
    language = document.querySelector('meta[name="language"]').content || 'en';
    let currentPage = 1;

    // Initialize pendingChanges with fallback to defaults
    let pendingChanges = universalPendingChanges ? universalPendingChanges : { ...defaultPendingChanges };

    const { searchTerm, exactMatch, searchIn, filters, ignoreDiacritics, startsWith, endsWith, rowsPerPage, sortOrder } = pendingChanges;

    let changesList = [];
    if (searchTerm) {
        const translatedSearchTerm = await getTranslatedText('searchTerm', language);
        changesList.push(`<strong>${translatedSearchTerm}</strong>: "${searchTerm}"`);
    }
    if (exactMatch) {
        const translatedExactMatch = await getTranslatedText('exactMatch', language);
        changesList.push(`<strong>${translatedExactMatch}</strong>: ${translatedExactMatch}`);
    }
    if (searchIn.word || searchIn.root || searchIn.definition || searchIn.etymology) {
        let searchInFields = [];
        if (searchIn.word) searchInFields.push(await getTranslatedText('searchInWord', language));
        if (searchIn.root) searchInFields.push(await getTranslatedText('searchInRoot', language));
        if (searchIn.definition) searchInFields.push(await getTranslatedText('searchInDefinition', language));
        if (searchIn.etymology) searchInFields.push(await getTranslatedText('searchInEtymology', language));
        const translatedSearchIn = await getTranslatedText('searchIn', language);
        changesList.push(`<strong>${translatedSearchIn}</strong>: ${searchInFields.join(', ')}`);
    }
    if (ignoreDiacritics) {
        const translatedIgnoreDiacritics = await getTranslatedText('ignoreDiacritics', language);
        changesList.push(`<strong>${translatedIgnoreDiacritics}</strong>`);
    }
    if (startsWith) {
        const translatedStartsWith = await getTranslatedText('startsWith', language);
        changesList.push(`<strong>${translatedStartsWith}</strong>`);
    }
    if (endsWith) {
        const translatedEndsWith = await getTranslatedText('endsWith', language);
        changesList.push(`<strong>${translatedEndsWith}</strong>`);
    }
    if (filters.length > 0) {
        const translatedFilters = await getTranslatedText('filters', language);
        const translatedFilterValues = await Promise.all(filters.map(async filter => await getTranslatedText(filter, language)));
        changesList.push(`<strong>${translatedFilters}</strong>: ${translatedFilterValues.join(', ')}`);
    }
    if (rowsPerPage !== 20) {
        const translatedRowsPerPage = await getTranslatedText('rowsPerPage', language);
        changesList.push(`<strong>${translatedRowsPerPage}</strong>: ${rowsPerPage}`);
    }
    if (sortOrder) {

        console.log(sortOrder);
        
        const translatedSortOrder = await getTranslatedText('sortOrder', language);
        const sortOrderTranslation = await getTranslatedText(sortOrder, language); // Get the translated value for sortOrder
        changesList.push(`<strong>${translatedSortOrder}</strong>: ${sortOrderTranslation}`);
    }
    const translatedPendingChanges = await getTranslatedText('pendingChanges', language);
    const translatedNoPendingChanges = await getTranslatedText('noPendingChanges', language);

    universalPendingChanges = pendingChanges;

    const pendingChangesElement = document.getElementById('dict-pending-changes');

    pendingChangesElement.innerHTML = changesList.length > 0 ? `<ul>${changesList.map(item => `<li>${item}</li>`).join('')}</ul>` : `<p>${translatedNoPendingChanges}</p>`;
}

export async function initializeFormEventListeners(allRows, rowsPerPage) {
    let pendingChanges = universalPendingChanges ? universalPendingChanges : { ...defaultPendingChanges };

    if (!universalPendingChanges) {
        universalPendingChanges = pendingChanges;
    }

    const language = document.querySelector('meta[name="language"]').content || 'en';
    const filterSelect = document.getElementById('dct-wrd-flter');
    const searchInput = document.getElementById('dict-search-input');
    const predictionBox = document.getElementById('dict-search-predictions');
    const rowsPerPageSelect = document.getElementById('dct-rws-inp');
    const advancedSearchButton = document.getElementById('dict-advanced-search-btn');
    let currentPage = 1;
    let debounceTimeout;

    if (filterSelect) {
        filterSelect.addEventListener('change', async () => {
            pendingChanges.filters = Array.from(filterSelect.selectedOptions).map(option => option.value);
            universalPendingChanges = pendingChanges;
            await updatePendingChangesList(language);
            currentPage = 1;
        });
    }

    if (rowsPerPageSelect) {
        rowsPerPageSelect.addEventListener('change', async () => {
            try {
                const rowsPerPageValue = parseInt(rowsPerPageSelect.value, 10);
                pendingChanges.rowsPerPage = rowsPerPageValue;
                universalPendingChanges = pendingChanges;
                await updatePendingChangesList(language);
                currentPage = 1;
            } catch (error) {
                console.error('Error during change event handling:', error);
            }
        });
    } else {
        console.error('Element not found for ID dct-rws-inp');
    }

    if (advancedSearchButton) {
        advancedSearchButton.addEventListener('click', async () => {
            await initAdvancedSearchPopup(allRows, rowsPerPage, language);
        });
    }

    const versionChecks = document.querySelectorAll('input[name="version"]');
const applySettingsButton = document.getElementById('dict-apply-settings-button');

// Create the alert container
const alertContainer = document.createElement('div');
alertContainer.id = 'alert-container';
alertContainer.style.position = 'fixed';
alertContainer.style.top = '100px';
alertContainer.style.left = '50%';
alertContainer.style.transform = 'translateX(-50%)';
alertContainer.style.backgroundColor = '#f44336';
alertContainer.style.color = 'white';
alertContainer.style.padding = '10px';
alertContainer.style.borderRadius = '5px';
alertContainer.style.display = 'none';
alertContainer.style.zIndex = '1000';
document.body.appendChild(alertContainer);

function showAlert(message) {
    alertContainer.textContent = message;
    alertContainer.style.display = 'block';
    
    setTimeout(() => {
        alertContainer.style.display = 'none';
    }, 3000);
}

versionChecks.forEach(check => {
    // Set the initial checked state based on pendingChanges
    check.checked = !!universalPendingChanges.versionDisplay[check.value];

    check.addEventListener('change', function() {
        // Check if at least one checkbox is selected
        const anySelected = Array.from(versionChecks).filter(c => c.checked).length > 0;

        if (!anySelected) {
            showAlert('Please select at least one version.');
            this.checked = true; // Recheck the checkbox to prevent unchecking
        } else {
            // Update pendingChanges.versionDisplay based on the checkbox state
            universalPendingChanges.versionDisplay[this.value] = this.checked;

            // Call processAllSettings to re-process the rows
        }
    });
});

    
} 

export function updateUniversalPendingChanges(i) {
    universalPendingChanges = i;
        }
