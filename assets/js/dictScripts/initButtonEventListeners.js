import { processAllSettings, displayPage } from './processRows.js';
import { universalPendingChanges, updateUniversalPendingChanges, updatePendingChangesList, defaultPendingChanges, initializeFormEventListeners } from './initFormEventListeners.js';
import { initAdvancedSearchPopup, initStatisticsPopup } from './popups.js';
import { updatePagination } from './pagination.js';
import { boxClickListener } from "./boxEvents.js";
import { filteredRows } from "../mainDict.js";
import { getTranslatedText } from './loadTexts.js';
import { initUrl } from './urlParameters.js';
import { updateDictionaryBoxes, initCensoring} from './censor-module.js'; 

export async function initializeButtonEventListeners(allRows, rowsPerPage, currentSortOrder) {

    //console.log('Initializing Button Event Listeners');
    
    const language = document.querySelector('meta[name="language"]').content || 'en';
    let currentPage = 1;
    let pendingChanges = universalPendingChanges ? universalPendingChanges : defaultPendingChanges;
    
    // Ensure pending changes are visible on page load
    const pendingChangesElement = document.getElementById('dict-pending-changes');
    if (pendingChangesElement) {
        pendingChangesElement.style.display = 'block';
    }

    await initializeFormEventListeners(allRows, rowsPerPage);

    pendingChanges = universalPendingChanges;
    
    await updatePendingChangesList(language);

    const orderBySelect = document.getElementById('dct-ord-slt');
    if (orderBySelect) {
        orderBySelect.addEventListener('change', async () => {
            pendingChanges.sortOrder = orderBySelect.value;
            updateUniversalPendingChanges(pendingChanges);
            await updatePendingChangesList(language);
        });
    }

    await boxClickListener(allRows, language, pendingChanges);

    const filterSelect = document.getElementById('dct-wrd-flt');
    if (filterSelect) {
        filterSelect.addEventListener('change', async () => {
            pendingChanges.filters = Array.from(filterSelect.selectedOptions).map(option => option.value);
            updateUniversalPendingChanges(pendingChanges);
            await updatePendingChangesList(language);
        });
    }

    const viewStatisticsButton = document.getElementById('dict-view-statistics-button');
    if (viewStatisticsButton) {
        viewStatisticsButton.addEventListener('click', async () => {
           await initStatisticsPopup(allRows);
        });
    }

    const applySettingsButton = document.getElementById('dict-apply-settings-button');
    if (applySettingsButton) {
        applySettingsButton.addEventListener('click', async () => {
                const url = new URL(window.location);
                url.search = ''; // Remove all query parameters
                window.history.pushState({}, '', url.toString());
                await processAllSettings(allRows, universalPendingChanges.rowsPerPage, currentPage, universalPendingChanges.sortOrder);
        });
    }

    const clearSettingsButton = document.getElementById('dict-clear-settings-button');
    if (clearSettingsButton) {
        clearSettingsButton.addEventListener('click', async () => {
            pendingChanges = {
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
                sortOrder: 'titleup', 
                versionDisplay: {
                    NR: true, 
                    OV22: true, 
                    NV24: true, 
                    NV25: true, 
                    V225: true
    
                }
            };
            // Reset form fields in the advanced search popup
            document.getElementById('dict-search-input').value = '';
            document.getElementById('dict-search-in-word').checked = true;
            document.getElementById('dict-search-in-root').checked = true;
            document.getElementById('dict-search-in-definition').checked = true;
            document.getElementById('dict-search-in-etymology').checked = false;
            document.getElementById('dict-exact-match').checked = false;
            // Reset selected filters
            const wordFilterSelect = document.getElementById('dct-wrd-flt');
            Array.from(wordFilterSelect.options).forEach(option => {
                option.selected = false;
            });

            //reset Version Checks
            const versionChecks = document.querySelectorAll('input[name="version"]');

            versionChecks.forEach(check => {
                check.checked = !!pendingChanges.versionDisplay[check.value];  
            });

            // Reset sort order
            document.getElementById('dct-ord-slt').selectedIndex = 0; // Set default sort order
            
            updateUniversalPendingChanges(pendingChanges);
            await updatePendingChangesList(language);
            await processAllSettings(allRows, pendingChanges.rowsPerPage, currentPage, pendingChanges.sortOrder);
            // Remove URL parameters without reloading the page
            history.pushState({}, document.title, window.location.pathname);
        });
    }

    const clearSearchButton = document.getElementById('dict-clear-search-button');
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', async () => {
            pendingChanges.searchTerm = '';
            document.getElementById('dict-search-input').value = '';
            updateUniversalPendingChanges(pendingChanges);
            await updatePendingChangesList(language);
            // Remove URL parameters without reloading the page
            history.pushState({}, document.title, window.location.pathname);
        });
    }
    
    updateDictionaryBoxes();

    await initCensoring();
 
    const searchInput = document.getElementById('dict-search-input');
    const predictionBox = document.getElementById('dict-search-predictions');

    document.querySelectorAll('.pagination-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetPage = parseInt(e.target.dataset.page, 10);
            if (!isNaN(targetPage)) {
                navigateToPage(targetPage);
            }
        });
    });

    function navigateToPage(pageNumber) {
        if (!isNaN(pageNumber) && pageNumber >= 1) {
            currentPage = pageNumber;
        } else {
            currentPage = 1;
        }
        const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
        updatePagination(currentPage, totalPages);
        displayPage(currentPage, rowsPerPage, pendingChanges.searchTerm, pendingChanges.searchIn, pendingChanges.exactMatch, allRows);
    }
    
    // Initial page load
    if (filteredRows) {
        navigateToPage(1);
    }

    // Info Button Event Listener
    const infoButton = document.getElementById('dict-info-button');
    const infoPopup = document.getElementById('dict-info-popup');
    const infoPopupOverlay = document.getElementById('popup-overlay');
    const closeInfoButton = document.getElementById('dict-close-info-button');
    const instructionsTitle = document.getElementById('instructions-title');
    const instructionsContent = document.getElementById('instructions-content');
    const legendTitle = document.getElementById('legend-title');
    const legendContent = document.getElementById('legend-content');

    const instructionsFilePath = '/assets/data/instructions.json'; // Path to the JSON file

    async function fetchInstructions(filePath) {
        const response = await fetch(filePath);
        const data = await response.json();
        return data;
    }

    async function setInfoContent(language, filePath) {
        const data = await fetchInstructions(filePath);

        const instructions = data[language];
        if (instructions) {
            instructionsTitle.textContent = instructions.instTitle;
            instructionsContent.innerHTML = instructions.instContent;

            legendTitle.textContent = instructions.legTitle;
            legendContent.innerHTML = instructions.legContent + '<br><ul>';

            for (const part in instructions.partsOfSpeech) {
                legendContent.innerHTML += `<li><strong>${part}:</strong> ${instructions.partsOfSpeech[part]}</li>`;
            }
            legendContent.innerHTML += '</ul>';

            closeInfoButton.textContent = instructions.close;
        } else {
            console.error('Language not supported in the instructions file');
        }
    }
    
    if (infoButton && infoPopup && infoPopupOverlay && closeInfoButton && instructionsTitle && instructionsContent && legendTitle && legendContent) {
        infoButton.addEventListener('click', async () => {
            await setInfoContent(document.documentElement.lang || 'en', instructionsFilePath); // Use the document language or default to 'en'
            infoPopup.classList.remove('hidden');
            infoPopup.classList.add('active');
            infoPopupOverlay.classList.remove('hidden');
            infoPopupOverlay.classList.add('active');
            closeInfoButton.classList.remove('hidden');
            closeInfoButton.classList.add('active');
        });

        closeInfoButton.addEventListener('click', () => {
            infoPopup.classList.add('hidden');
            infoPopup.classList.remove('active');
            infoPopupOverlay.classList.add('hidden');
            infoPopupOverlay.classList.remove('active');
            closeInfoButton.classList.add('hidden');
            closeInfoButton.classList.remove('active');
        });
    } else {
        console.error('Info popup elements not found');
    }

   // console.log('Button Event Listeners initialized'); 
}
