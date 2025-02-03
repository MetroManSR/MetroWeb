import { fetchData } from './dictScripts/fetchData.js';
import { setTexts } from './dictScripts/loadTexts.js';
import { initAdvancedSearchPopup, initStatisticsPopup } from './dictScripts/popups.js';
import { initializeButtonEventListeners } from './dictScripts/initButtonEventListeners.js';
import { updatePendingChangesList } from './dictScripts/initFormEventListeners.js';
import { createPaginationControls } from './dictScripts/pagination.js';
import { processAllSettings, sortRows, displayPage } from './dictScripts/processRows.js';
import { cleanData } from './dictScripts/csvUtils.js';
import { getRelatedWordsByRoot, displayError } from './dictScripts/utils.js';
import { renderBox } from './dictScripts/boxes.js';
import { initUrl } from './dictScripts/urlParameters.js';
import { initializeErrorButton } from './dictScripts/errorModule.js';
    
export let filteredRows;

document.addEventListener('DOMContentLoaded', async function() {
    const language = document.querySelector('meta[name="language"]').content || 'en';
    await setTexts(language);

    const filterSortingContainer = document.getElementById('dict-filter-sorting-container');
    let pendingChanges = document.getElementById('dict-pending-changes');

    function showLoadingMessage() {
        const loadingMessage = document.getElementById('dict-loading-message');
        if (loadingMessage) {
            loadingMessage.style.display = 'block';
        }
    }

    function hideLoadingMessage() {
        const loadingMessage = document.getElementById('dict-loading-message');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    }

    showLoadingMessage();

    initializeErrorButton();

    let allRows = []; // Ensure allRows is defined outside the try-catch block
    let rowsPerPage = 20; // Default rows per page
    let currentPage = 1;
    let currentSortOrder = 'titleup'; // Default sort order
    pendingChanges = {
        searchTerm: '',
        exactMatch: false,
        searchIn: { word: true, root: true, definition: true, etymology: false },
        filters: [],
        rowsPerPage: 20,
        sortOrder: 'titleup', 
        versionDisplay: {
        OV22: true, 
        NV24: true, 
        NV25: true, 
        V225: true
    
       }
    };

    try {
        hideLoadingMessage();

        function displayError(message) {
            const errorContainer = document.getElementById('dict-error-message');
            errorContainer.innerHTML = `<p>${message}</p>`;
            errorContainer.style.display = 'block';
        }

        // Define URLs based on language
        const esDictURL = 'https://docs.google.com/spreadsheets/d/1ZzYEerR-BTsk5QaOefiWhS3mhQe9YQnY/export?format=xlsx';
        const enDictURL = 'https://docs.google.com/spreadsheets/d/1dBiaS1ea3B3ryv4PYwAoedVeQn7SOGiw/export?format=xlsx';
        const esRootURL = 'https://docs.google.com/spreadsheets/d/13LHqyyBGxXGEd5XCi0HxwpdkWToXi_H0/export?format=xlsx';
        const enRootURL = 'https://docs.google.com/spreadsheets/d/1FR5xg3xvfuOqnvSgm9ZfSA2w5l4Rg7Ho/export?format=xlsx';

        const dictionaryFile = language === 'es' ? esDictURL : enDictURL;
        const rootsFile = language === 'es' ? esRootURL : enRootURL;

        async function fetchWithFallback(url, type) {
            try {
                return await fetchData(url, type);
            } catch (error) {
                console.error(`Error fetching data from ${url}:`, error);
                return [];
            }
        }

        const [dictionaryData, rootsData] = await Promise.all([
            fetchWithFallback(dictionaryFile, 'word'), 
            fetchWithFallback(rootsFile, 'root')
        ]);

        const cleanedDictionaryData = (await cleanData(dictionaryData, 'word')).sort((a, b) => a.title.localeCompare(b.title));
        const cleanedRootsData = (await cleanData(rootsData, 'root')).sort((a, b) => a.title.localeCompare(b.title));

        cleanedDictionaryData.forEach((item, index) => { item.id = index + 1; });
        cleanedRootsData.forEach((item, index) => { item.id = index + 1; });

        allRows = [...cleanedDictionaryData, ...cleanedRootsData];
        
        filteredRows = allRows;
        filteredRows = getRelatedWordsByRoot(sortRows(allRows, currentSortOrder)); // Sorting rows initially

        createPaginationControls(rowsPerPage, currentPage);

        const isUrlHandled = await initUrl(allRows, rowsPerPage, 1, 'titleup');
        
        if (isUrlHandled !== false) {
            filteredRows = isUrlHandled;
            await renderBox(allRows, '', false, {}, rowsPerPage, 1);
        } else {
            displayPage(currentPage, rowsPerPage, '', { word: true, root: true, definition: false, etymology: false }, false, allRows);
        }

        const advancedSearchForm = document.getElementById('advanced-search-form');
        if (advancedSearchForm) {
            advancedSearchForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(advancedSearchForm);
                const params = {
                    searchTerm: formData.get('search-term'),
                    word: formData.get('search-in-word') === 'on',
                    root: formData.get('search-in-root') === 'on',
                    definition: formData.get('search-in-definition') === 'on',
                    etymology: formData.get('search-in-etymology') === 'on',
                    exactMatch: formData.get('exact-match') === 'on'
                };
                await processAllSettings(params, allRows, rowsPerPage, displayPage, currentPage, pendingChanges.sortOrder);
            });
        }

        const orderBySelect = document.getElementById('dict-order-by-select');
        if (orderBySelect) {
            orderBySelect.addEventListener('change', () => {
                pendingChanges.sortOrder = orderBySelect.value;
                updatePendingChangesList(pendingChanges, language);
            });
        }

        document.getElementById('dict-loading-message').style.display = 'none';
    } catch (error) {
        console.error('Error loading data:', error);
        
        const errorString = language === "en" ? 'Failed to load dictionary data. Please try again later.' : 'Ha fallado la carga del diccionario, por favor intente de nuevo más tarde';
        
        displayError(errorString);
        document.getElementById('dict-loading-message').style.display = 'none';
    }

    await initializeButtonEventListeners(allRows, rowsPerPage, currentSortOrder);
    initializeButtonEventListeners(allRows, rowsPerPage, currentSortOrder);
});

export function updateFilteredRows(i) {
    filteredRows = i;
}
