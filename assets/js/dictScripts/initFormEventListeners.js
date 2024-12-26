import { getTranslatedText } from './loadTexts.js';
import { highlight } from './utils.js';
import { initAdvancedSearchPopup } from './popups.js';

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
    sortOrder: 'titleup' // Default sort order
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
    let currentPage = 1;

    if (filterSelect) {
        filterSelect.addEventListener('change', async () => {
            pendingChanges.filters = Array.from(filterSelect.selectedOptions).map(option => option.value);
            universalPendingChanges = pendingChanges;
            updatePendingChangesList(language);
            
            currentPage = 1;
       });
    }

    const searchInput = document.getElementById('dict-search-input');
    const predictionBox = document.getElementById('dict-search-predictions');

    searchInput.addEventListener('input', async function() {
        const searchTerm = this.value.trim().toLowerCase();
        predictionBox.style.width = `${searchInput.offsetWidth}px`;

        if (searchTerm.length === 0) {
            predictionBox.innerHTML = '';
            pendingChanges.searchTerm = ''; // Clear searchTerm in pending changes
            universalPendingChanges = pendingChanges;
            currentPage = 1;
            predictionBox.classList.remove("active");
            predictionBox.classList.add("hidden");
            return;
        }

        predictionBox.classList.remove("hidden");
        predictionBox.classList.add("active");

        const searchIn = pendingChanges.searchIn;
        const predictions = allRows
            .filter(row => {
                const titleMatch = searchIn.word && row.type === 'word' && row.title.toLowerCase().includes(searchTerm);
                const rootMatch = searchIn.root && row.type === 'root' && row.title.toLowerCase().includes(searchTerm);
                const definitionMatch = searchIn.definition && row.meta.toLowerCase().includes(searchTerm);
                const etymologyMatch = searchIn.etymology && row.morph.some(morphItem => morphItem.toLowerCase().includes(searchTerm));
                return titleMatch || rootMatch || definitionMatch || etymologyMatch;
            })
            .slice(0, 10) // Limit to the first 10 matches
            .map(row => ({ title: row.title, meta: row.meta }));

        if (predictions.length === 0) {
            predictionBox.innerHTML = '';
            pendingChanges.searchTerm = searchTerm; // Update searchTerm in pending changes
            updateUniversalPendingChanges(pendingChanges);
            currentPage = 1;
            return;
        }

        predictionBox.innerHTML = predictions.map(({ title, meta }) => 
            `<div>${highlight(title, searchTerm, pendingChanges.searchIn, { title })} (${meta})</div>`
        ).join('');

        Array.from(predictionBox.children).forEach((prediction, index) => {
            prediction.addEventListener('click', async () => {
                searchInput.value = predictions[index].title;
                predictionBox.innerHTML = '';
                pendingChanges.searchTerm = predictions[index].title; // Update searchTerm in pending changes
                universalPendingChanges = pendingChanges;
                currentPage = 1;
            });
        });

        pendingChanges.searchTerm = searchTerm;
        currentPage = 1;
        universalPendingChanges = pendingChanges;
        updatePendingChangesList(language);
    });

    document.addEventListener('focusin', (e) => {
        if (!searchInput.contains(e.target) && !predictionBox.contains(e.target)) {
            predictionBox.innerHTML = '';
        }
    });

    searchInput.addEventListener('focus', async () => {
        if (searchInput.value.trim().length > 0) {
            searchInput.dispatchEvent(new Event('input'));
        }
    });

    const rowsPerPageSelect = document.getElementById('dct-rws-inp');

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

    const advancedSearchButton = document.getElementById('dict-advanced-search-btn');
    if (advancedSearchButton) {
        advancedSearchButton.addEventListener('click', async () => {
            await initAdvancedSearchPopup(allRows, rowsPerPage, language);
        });
    }
}

export function updateUniversalPendingChanges(i) {
    universalPendingChanges = i;
}
