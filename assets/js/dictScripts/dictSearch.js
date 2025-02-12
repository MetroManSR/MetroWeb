import { createPaginationControls, updatePagination } from './pagination.js';
import { renderBox, createDictionaryBox, createNoMatchBox } from './boxes.js';
import { updateQueryString, updatePendingChangesListBasedOnLanguage } from './urlParameters.js';
import { universalPendingChanges, updateUniversalPendingChanges, updatePendingChangesList, defaultPendingChanges } from './initFormEventListeners.js';
import { getSimilarity } from './utils.js';

export let pendingChanges = {
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

const searchInput = document.getElementById('dict-search-input');
const predictionBox = document.getElementById('dict-search-predictions');
const rowsPerPageSelect = document.getElementById('dict-rows-per-page-select');
let debounceTimeout;
const language = document.documentElement.lang;

// Function to display a specific word or root entry by ID
export function displaySpecificEntry(row, allRows) {
    const dictionaryContainer = document.getElementById('dict-dictionary');
    dictionaryContainer.innerHTML = ''; // Clear previous entries

    if (!row) {
        const noMatchBox = createNoMatchBox();
        dictionaryContainer.appendChild(noMatchBox);
        return;
    }

    const box = createDictionaryBox(row, allRows, '', false, {});
    if (box) {
        dictionaryContainer.appendChild(box);
    }
}

// Function for exact and unique word search
export function wordSpecific(term, allRows) {
    const specificWord = allRows.find(row => row.type === 'word' && row.title.toLowerCase() === term.toLowerCase());
    displaySpecificEntry(specificWord, allRows);
}

// Function for exact and unique root search
export function rootSpecific(term, allRows) {
    const specificRoot = allRows.find(row => row.type === 'root' && row.title.toLowerCase() === term.toLowerCase());
    displaySpecificEntry(specificRoot, allRows);
}

// Function to initialize the search input
export async function initSearchInput(allRows, currentPage) {
    // Check if there is already text in the search bar and update pendingChanges list and query
    if (searchInput.value.trim() !== '') {
        const searchTerm = searchInput.value.trim();
        pendingChanges.searchTerm = searchTerm;
        updateUniversalPendingChanges(pendingChanges);
        updateQueryString();
        
    }

    // Add event listener to update on input
    searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimeout); // Clear the previous debounce timer

        const searchTerm = this.value.trim().toLowerCase();
        predictionBox.style.width = `${searchInput.offsetWidth}px`;

        debounceTimeout = setTimeout(async () => { // Set a new debounce timer
            if (searchTerm.length === 0) {
                predictionBox.innerHTML = '';
                pendingChanges.searchTerm = ''; // Clear searchTerm in pending changes
                updateUniversalPendingChanges(pendingChanges);
                currentPage = 1;
                predictionBox.classList.remove("active");
                predictionBox.classList.add("hidden");
            
                return;
            }

            const searchTermsArray = searchTerm.includes(',') ? searchTerm.split(',').map(term => term.trim()) : [searchTerm];

            predictionBox.classList.remove("hidden");
            predictionBox.classList.add("active");

            const searchIn = pendingChanges.searchIn;
            const predictions = allRows
                .filter(row => searchTermsArray.some(term => {
                    const titleMatch = searchIn.word && row.type === 'word' && row.title.toLowerCase().includes(term);
                    const rootMatch = searchIn.root && row.type === 'root' && row.title.toLowerCase().includes(term);
                    const definitionMatch = searchIn.definition && row.meta && row.meta.toLowerCase().includes(term);
                    const etymologyMatch = searchIn.etymology && row.morph.some(morphItem => morphItem.toLowerCase().includes(term));
                    return titleMatch || rootMatch || definitionMatch || etymologyMatch;
                }))
                .slice(0, 10) // Limit to the first 10 matches
                .map(row => {
                    const titleSimilarity = getSimilarity(row.title, searchTerm);
                    const metaSimilarity = getSimilarity(row.meta, searchTerm);
                    const displayText = metaSimilarity > titleSimilarity ? row.meta : row.title;
                    const totalSimilarity = Math.max(titleSimilarity, metaSimilarity);
                    return { title: row.title, meta: row.meta || '', displayText, totalSimilarity };
                });

            console.log('Predictions:', predictions); // Debug log

            if (predictions.length === 0) {
                // If no predictions, suggest possible corrections
                const suggestions = allRows
                    .map(row => {
                        const metaParts = row.meta ? row.meta.split(',').map(part => part.trim()) : [];
                        const metaSimilarity = metaParts.map(part => getSimilarity(part, searchTerm)).reduce((max, current) => Math.max(max, current), 0);
                        return {
                            title: row.title,
                            similarity: getSimilarity(row.title, searchTerm),
                            metaSimilarity: metaSimilarity
                        };
                    })
                    .map(row => ({
                        ...row,
                        displayText: row.similarity > row.metaSimilarity ? row.title : (row.meta || ''),
                        totalSimilarity: Math.max(row.similarity, row.metaSimilarity)
                    }))
                    .sort((a, b) => b.totalSimilarity - a.totalSimilarity)
                    .slice(0, 10);

                console.log('Suggestions:', suggestions); // Debug log

                if (suggestions.length > 0) {
                    predictionBox.innerHTML = suggestions.map(({ displayText, totalSimilarity }) => {
                        const percentage = (totalSimilarity * 100).toFixed(2);
                        const color = `rgb(${255 - totalSimilarity * 255}, ${totalSimilarity * 255}, 0)`; // Shades of green and red
                        return `<div style="background-color: ${color}; cursor: pointer;">${displayText} (${percentage}%)</div>`;
                    }).join('');

                    // Add click event to suggestions to paste them into the search input
                    Array.from(predictionBox.children).forEach((suggestion, index) => {
                        suggestion.addEventListener('click', () => {
                            searchInput.value = suggestions[index].displayText;
                            predictionBox.innerHTML = '';
                            pendingChanges.searchTerm = suggestions[index].displayText; // Update searchTerm in pending changes
                            updateUniversalPendingChanges(pendingChanges);
                            currentPage = 1;
                            updateQueryString();
                        });
                    });
                } else {
                    predictionBox.innerHTML = '';
                }

                pendingChanges.searchTerm = searchTerm; // Update searchTerm in pending changes
                updateUniversalPendingChanges(pendingChanges);
                currentPage = 1;
                updateQueryString();
                return;
            } else {
                predictionBox.innerHTML = predictions.map(({ displayText, totalSimilarity }) => {
                    const percentage = (totalSimilarity * 100).toFixed(2);
                    const color = `rgb(${255 - totalSimilarity * 255}, ${totalSimilarity * 255}, 0)`; // Shades of green and red
                    return `<div style="background-color: ${color}; cursor: pointer;">${displayText} (${percentage}%)</div>`;
                }).join('');

                Array.from(predictionBox.children).forEach((prediction, index) => {
                    prediction.addEventListener('click', async () => {
                        searchInput.value = predictions[index].displayText;
                        predictionBox.innerHTML = '';
                        pendingChanges.searchTerm = predictions[index].displayText; // Update searchTerm in pending changes
                        updateUniversalPendingChanges(pendingChanges);
                        currentPage = 1;
                        updateQueryString();
                    });
                });

                // Remove suggestions if the input matches 100%
                if (predictions.some(p => p.title.toLowerCase() === searchTerm)) {
                    predictionBox.innerHTML = '';
                    pendingChanges.searchTerm = searchTerm; // Update searchTerm in pending changes
                    updateUniversalPendingChanges(pendingChanges);
                    currentPage = 1;
                    updateQueryString();
                    return;
                }
            }
        }, 300); // 300ms debounce timer
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

    if (rowsPerPageSelect) {
        rowsPerPageSelect.addEventListener('change', async () => {
            try {
                const rowsPerPageValue = parseInt(rowsPerPageSelect.value, 10);
                pendingChanges.rowsPerPage = rowsPerPageValue;
                updateUniversalPendingChanges(pendingChanges);
                currentPage = 1;
                
            } catch (error) {
                console.error('Error during change event handling:', error);
            }
        });
    }
}
