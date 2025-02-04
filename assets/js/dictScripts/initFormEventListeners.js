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
    filters:,
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

export let universalPendingChanges = {...defaultPendingChanges };

export async function updatePendingChangesList(language) {
    language = document.querySelector('meta[name="language"]').content || 'en';
    const pendingChanges = universalPendingChanges;

    const changesList = [] ;

    if (pendingChanges.searchTerm) {
        changesList.push(`<strong>${await getTranslatedText('searchTerm', language)}</strong>: "${pendingChanges.searchTerm}"`);
    }
    if (pendingChanges.exactMatch) {
        changesList.push(`<strong>${await getTranslatedText('exactMatch', language)}</strong>: ${await getTranslatedText('exactMatch', language)}`);
    }

    const searchInFields =;
    if (pendingChanges.searchIn.word) searchInFields.push(await getTranslatedText('searchInWord', language));
    if (pendingChanges.searchIn.root) searchInFields.push(await getTranslatedText('searchInRoot', language));
    if (pendingChanges.searchIn.definition) searchInFields.push(await getTranslatedText('searchInDefinition', language));
    if (pendingChanges.searchIn.etymology) searchInFields.push(await getTranslatedText('searchInEtymology', language));

    if (searchInFields.length > 0) {
        changesList.push(`<strong>${await getTranslatedText('searchIn', language)}</strong>: ${searchInFields.join(', ')}`);
    }

    if (pendingChanges.ignoreDiacritics) {
        changesList.push(`<strong>${await getTranslatedText('ignoreDiacritics', language)}</strong>`);
    }
    if (pendingChanges.startsWith) {
        changesList.push(`<strong>${await getTranslatedText('startsWith', language)}</strong>`);
    }
    if (pendingChanges.endsWith) {
        changesList.push(`<strong>${await getTranslatedText('endsWith', language)}</strong>`);
    }

    if (pendingChanges.filters.length > 0) {
        const translatedFilterValues = await Promise.all(pendingChanges.filters.map(filter => getTranslatedText(filter, language)));
        changesList.push(`<strong>${await getTranslatedText('filters', language)}</strong>: ${translatedFilterValues.join(', ')}`);
    }

    if (pendingChanges.rowsPerPage!== 20) {
        changesList.push(`<strong>${await getTranslatedText('rowsPerPage', language)}</strong>: ${pendingChanges.rowsPerPage}`);
    }

    if (pendingChanges.sortOrder) {
        changesList.push(`<strong>${await getTranslatedText('sortOrder', language)}</strong>: ${await getTranslatedText(pendingChanges.sortOrder, language)}`);
    }

    const pendingChangesElement = document.getElementById('dict-pending-changes');
    pendingChangesElement.innerHTML = changesList.length > 0
      ? `<ul>${changesList.map(item => `<li>${item}</li>`).join('')}</ul>`
      : `<p>${await getTranslatedText('noPendingChanges', language)}</p>`;
}

export async function initializeFormEventListeners(allRows) {
    const language = document.querySelector('meta[name="language"]').content || 'en';
    const filterSelect = document.getElementById('dct-wrd-flter');
    const searchInput = document.getElementById('dict-search-input');
    const predictionBox = document.getElementById('dict-search-predictions');
    const rowsPerPageSelect = document.getElementById('dct-rws-inp');
    const advancedSearchButton = document.getElementById('dict-advanced-search-btn');
    const versionChecks = document.querySelectorAll('input[name="version"]');
    let currentPage = 1;
    let debounceTimeout;

    if (filterSelect) {
        filterSelect.addEventListener('change', async () => {
            universalPendingChanges.filters = Array.from(filterSelect.selectedOptions).map(option => option.value);
            await updatePendingChangesList(language);
            currentPage = 1;
            processAllSettings(allRows, universalPendingChanges.rowsPerPage, currentPage, universalPendingChanges.sortOrder);
        });
    }

    searchInput.addEventListener('input', createSearchInputHandler(searchInput, predictionBox, allRows, language));

    document.addEventListener('focusin', (e) => {
        if (!searchInput.contains(e.target) &&!predictionBox.contains(e.target)) {
            predictionBox.innerHTML = '';
            predictionBox.classList.remove("active");
            predictionBox.classList.add("hidden");
        }
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 0) {
            searchInput.dispatchEvent(new Event('input'));
        }
    });

    if (rowsPerPageSelect) {
        rowsPerPageSelect.addEventListener('change', async () => {
            const rowsPerPageValue = parseInt(rowsPerPageSelect.value, 10);
            if (!isNaN(rowsPerPageValue)) {
                universalPendingChanges.rowsPerPage = rowsPerPageValue;
                await updatePendingChangesList(language);
                currentPage = 1;
                processAllSettings(allRows, universalPendingChanges.rowsPerPage, currentPage, universalPendingChanges.sortOrder);
            } else {
                console.error("Invalid rowsPerPage value");
            }
        });
    } else {
        console.error('Element not found for ID dct-rws-inp');
    }

    if (advancedSearchButton) {
        advancedSearchButton.addEventListener('click', () => {
            initAdvancedSearchPopup(allRows, universalPendingChanges.rowsPerPage, language);
        });
    }

    versionChecks.forEach(check => {
        check.checked =!!universalPendingChanges.versionDisplay[check.value];
        check.addEventListener('change', createVersionCheckHandler(check, versionChecks, allRows));
    });
}

// --- Helper Functions ---

const createSearchInputHandler = (searchInput, predictionBox, allRows, language) => async function () {
    clearTimeout(this.debounceTimeout);

    const searchTerm = this.value.trim().toLowerCase();
    predictionBox.style.width = `${searchInput.offsetWidth}px`;

    this.debounceTimeout = setTimeout(async () => {
        await handleSearch(searchTerm, searchInput, predictionBox, allRows, language);
    }, 300);
};

const handleSearch = async (searchTerm, searchInput, predictionBox, allRows, language) => {
    if (searchTerm.length === 0) {
        predictionBox.innerHTML = '';
        universalPendingChanges.searchTerm = '';
        predictionBox.classList.remove("active");
        predictionBox.classList.add("hidden");
        await updatePendingChangesList(language);
        return;
    }

    predictionBox.classList.remove("hidden");
    predictionBox.classList.add("active");

    const searchIn = universalPendingChanges.searchIn;

    const filterAndSort = (rows) => rows
      .filter(row => {
            const titleMatch = searchIn.word && row.type === 'word' && row.title.toLowerCase().includes(searchTerm);
            const rootMatch = searchIn.root && row.type === 'root' && row.title.toLowerCase().includes(searchTerm);
            const definitionMatch = searchIn.definition && row.meta && row.meta.toLowerCase().includes(searchTerm);
            const etymologyMatch = searchIn.etymology && row.morph.some(morphItem => morphItem.toLowerCase().includes(searchTerm));
            return titleMatch || rootMatch || definitionMatch || etymologyMatch;
        })
      .map(row => {
            const titleSimilarity = getSimilarity(row.title.toLowerCase(), searchTerm);
            const metaSimilarity = row.meta? getSimilarity(row.meta.toLowerCase(), searchTerm): 0;
            const maxSimilarity = Math.max(titleSimilarity, metaSimilarity);
            return {
                title: row.title,
                meta: row.meta || '',
                similarity: maxSimilarity,
                isTitleMatch: titleSimilarity === maxSimilarity
            };
        })
      .sort((a, b) => b.similarity - a.similarity);

    const predictions = filterAndSort(allRows).slice(0, 10);

    if (predictions.length === 0) {
        const suggestions = filterAndSort(allRows)
          .map(row => {
                const metaParts = row.meta? row.meta.split(',').map(part => part.trim()):;
                const metaSimilarity = metaParts
                  .map(part => getSimilarity(part, searchTerm))
                  .reduce((max, current) => Math.max(max, current), 0); // Sort by highest similarity
                return {
                    title: row.title,
                    similarity: getSimilarity(row.title, searchTerm),
                    metaSimilarity: metaSimilarity
                };
            })
          .map(row => ({
              ...row,
                displayText: row.similarity > row.metaSimilarity? row.title: (row.meta || ''),
                totalSimilarity: Math.max(row.similarity, row.metaSimilarity)
            }))
          .sort((a, b) => b.totalSimilarity - a.totalSimilarity) // Sort suggestions by descending similarity
          .slice(0, 10);

        predictionBox.innerHTML = suggestions.map(({ displayText, totalSimilarity }) => {
            const percentage = (totalSimilarity * 100).toFixed(2);
            const color = `rgb(${255 - totalSimilarity * 255}, ${totalSimilarity * 255}, 0)`;
            return `<div style="background-color: ${color}; cursor: pointer;">${displayText} (${percentage}%)</div>`;
        }).join('');

        predictionBox.addEventListener('click', createSuggestionClickHandler(searchInput, predictionBox, language));

    } else {
        predictionBox.innerHTML = predictions.map(({ title, meta, isTitleMatch }) => {
            const titleStyle = isTitleMatch? 'font-weight: bold; font-size: 1.2em;': '';
            const metaStyle =!isTitleMatch? 'font-weight: bold; font-size: 1.2em;': '';

            return `<div>
                        <span style="${titleStyle}">${title}</span> 
                        ${meta? `<span style="${metaStyle}">(${meta})</span>`: ''}
                    </div>`;
        }).join('');

        predictionBox.addEventListener('click', createPredictionClickHandler(searchInput, predictionBox, language));

        if (predictions.some(p => p.title.toLowerCase() === searchTerm)) {
            predictionBox.innerHTML = '';
            universalPendingChanges.searchTerm = searchTerm;
            await updatePendingChangesList(language);
            return;
        }
    }

    universalPendingChanges.searchTerm = searchTerm;
    await updatePendingChangesList(language);
};

const createPredictionClickHandler = (searchInput, predictionBox, language) => async (event) => {
    const selectedValue = event.target.closest('div').querySelector('span').textContent.trim();
    if (selectedValue) {
        searchInput.value = selectedValue;
        predictionBox.innerHTML = '';
        universalPendingChanges.searchTerm = selectedValue;
        await updatePendingChangesList(language);
    }
};

const createSuggestionClickHandler = (searchInput, predictionBox, language) => (event) => {
    const suggestionDiv = event.target.closest('div');
    if (suggestionDiv) {
        const selectedValue = suggestionDiv.textContent.trim().split(' '); // Get text before the percentage
        searchInput.value = selectedValue;
        predictionBox.innerHTML = '';
        universalPendingChanges.searchTerm = selectedValue;
        updatePendingChangesList(language);
    }
};

const createVersionCheckHandler = (check, versionChecks, allRows) => function () {
    const anySelected = Array.from(versionChecks).some(c => c.checked);
    if (!anySelected) {
        showAlert('Please select at least one version.');
        this.checked = true;
    } else {
        universalPendingChanges.versionDisplay[this.value] = this.checked;
        processAllSettings(allRows, universalPendingChanges.rowsPerPage, 1, universalPendingChanges.sortOrder);
    }
};

//... (showAlert function - no changes needed)
// Create the alert container (only needs to be done once, usually in your main script file)
const alertContainer = document.createElement('div');
alertContainer.id = 'alert-container';
alertContainer.style.position = 'fixed';
alertContainer.style.top = '100px'; // Adjust as needed
alertContainer.style.left = '50%';
alertContainer.style.transform = 'translateX(-50%)';
alertContainer.style.backgroundColor = '#f44336'; // Red color (you can customize)
alertContainer.style.color = 'white';
alertContainer.style.padding = '10px';
alertContainer.style.borderRadius = '5px';
alertContainer.style.display = 'none'; // Initially hidden
alertContainer.style.zIndex = '1000'; // Ensure it's on top
document.body.appendChild(alertContainer); // Add it to the page

function showAlert(message) {
    alertContainer.textContent = message;
    alertContainer.style.display = 'block';

    setTimeout(() => {
        alertContainer.style.display = 'none';
    }, 3000); // Hide after 3 seconds (you can customize)
}

// Example usage:
// showAlert("This is an alert message!");


export function updateUniversalPendingChanges(i) {
    universalPendingChanges = i;
}
