import { processAllSettings } from './processRows.js';
import { universalPendingChanges, updateUniversalPendingChanges, defaultPendingChanges, updatePendingChangesList } from './initFormEventListeners.js';
import { filteredRows } from '../mainDict.js';
import { getTranslatedText } from './loadTexts.js';

const advancedSearchPopup = document.getElementById('dict-advanced-search-popup');
const advancedSearchOverlay = document.getElementById('popup-overlay');
const closeAdvancedSearch = document.getElementById('dict-close-advanced-search');
const addSearchBtnPopup = document.getElementById('dict-add-search-btn-popup');

export async function initAdvancedSearchPopup(allRows, rowsPerPage, currentLanguage) {
    // Load previous selections from pendingChanges
    const pendingChanges = universalPendingChanges ? universalPendingChanges : { ...defaultPendingChanges };

    // Show the popup and overlay
    advancedSearchPopup.classList.remove('hidden');
    advancedSearchOverlay.classList.add('active');
    closeAdvancedSearch.classList.remove('hidden');
    closeAdvancedSearch.classList.add('active');

    // Populate form fields with pendingChanges
    document.getElementById('dict-search-input').value = pendingChanges.searchTerm || '';
    document.getElementById('dict-search-in-word').checked = pendingChanges.searchIn.word;
    document.getElementById('dict-search-in-root').checked = pendingChanges.searchIn.root;
    document.getElementById('dict-search-in-definition').checked = pendingChanges.searchIn.definition;
    document.getElementById('dict-search-in-etymology').checked = pendingChanges.searchIn.etymology;
    document.getElementById('dict-exact-match').checked = pendingChanges.exactMatch;
    document.getElementById('dict-ignore-diacritics').checked = pendingChanges.ignoreDiacritics;
    document.getElementById('dict-starts-with').checked = pendingChanges.startsWith;
    document.getElementById('dict-ends-with').checked = pendingChanges.endsWith;

    // Populate selected filters
    const wordFilterSelect = document.getElementById('dct-wrd-flt');
    if (wordFilterSelect) {
        Array.from(wordFilterSelect.options).forEach(option => {
            option.selected = pendingChanges.filters.includes(option.value);
        });
    }

    // Close popup event listener
    closeAdvancedSearch.addEventListener('click', () => {
        advancedSearchPopup.classList.add('hidden');
        advancedSearchOverlay.classList.remove('active');
        closeAdvancedSearch.classList.add('hidden');
        closeAdvancedSearch.classList.remove('active');
    });

    // Add search event listener
    addSearchBtnPopup.addEventListener('click', async () => {
        // Update pendingChanges with form values
        pendingChanges.searchTerm = document.getElementById('dict-search-input').value.trim();
        pendingChanges.searchIn = {
            word: document.getElementById('dict-search-in-word').checked,
            root: document.getElementById('dict-search-in-root').checked,
            definition: document.getElementById('dict-search-in-definition').checked,
            etymology: document.getElementById('dict-search-in-etymology').checked
        };
        pendingChanges.exactMatch = document.getElementById('dict-exact-match').checked;
        pendingChanges.ignoreDiacritics = document.getElementById('dict-ignore-diacritics').checked;
        pendingChanges.startsWith = document.getElementById('dict-starts-with').checked;
        pendingChanges.endsWith = document.getElementById('dict-ends-with').checked;

        // Update selected filters
        if (wordFilterSelect) {
            pendingChanges.filters = Array.from(wordFilterSelect.selectedOptions).map(option => option.value);
        }

        // Update universal state and UI
        updateUniversalPendingChanges(pendingChanges);
        await updatePendingChangesList(currentLanguage);

        // Close the popup
        advancedSearchPopup.classList.add('hidden');
        advancedSearchOverlay.classList.remove('active');
        closeAdvancedSearch.classList.add('hidden');
        closeAdvancedSearch.classList.remove('active');
    });
}

export async function initStatisticsPopup(allRows) {
    const statisticsPopup = document.getElementById('dict-statistics-popup');  
    
    if (statisticsPopup.classList.contains('active')) {
        return;
    }

    const currentLanguage = document.querySelector('meta[name="language"]').content || 'en';
    
    const totalWords = allRows.filter(row => row.type === 'word').length;
    const totalRoots = allRows.filter(row => row.type === 'root').length;

    const partOfSpeechCounts = allRows.reduce((counts, row) => {
        if (row.type === 'word' && row.partofspeech) {
            counts[row.partofspeech] = (counts[row.partofspeech] || 0) + 1;
        }
        return counts;
    }, {});

    const wordsByInitialLetter = allRows.reduce((counts, row) => {
        if (row.type === 'word' && row.title) {
            const initial = row.title.charAt(0).toUpperCase();
            counts[initial] = (counts[initial] || 0) + 1;
        }
        return counts;
    }, {});

    // Translations for Statistics Popup
    const statisticsTitle = await getTranslatedText('statisticsTitle', currentLanguage);
    const totalWordsText = await getTranslatedText('totalWords', currentLanguage);
    const totalRootsText = await getTranslatedText('totalRoots', currentLanguage);
    const partOfSpeechTitle = await getTranslatedText('partOfSpeechTitle', currentLanguage);
    const wordsByLetterTitle = await getTranslatedText('wordsByLetterTitle', currentLanguage);
    const closeStatsText = await getTranslatedText('close', currentLanguage);

    const validPartOfSpeeches = [
        "noun", "verb", "adjective", "adverb", "conjunction",
        "interjection", "preposition", "expression", "pronoun", "root", "word"
    ];

    statisticsPopup.innerHTML = `
        <h3>${statisticsTitle}</h3>
        <p>${totalWordsText}: ${totalWords}</p>
        <p>${totalRootsText}: ${totalRoots}</p>
        <h4>${partOfSpeechTitle}</h4>
        <ul>
            ${await Promise.all(Object.entries(partOfSpeechCounts).map(async ([pos, count]) => {
                const posParts = pos.split(',').map(part => part.trim());
                const translatedParts = await Promise.all(posParts.map(async part => {
                    return validPartOfSpeeches.includes(part) ? await getTranslatedText(part, currentLanguage) : part;
                }));
                const finalPos = translatedParts.join(', ');
                return `<li>${finalPos}: ${count}</li>`;
            })).then(items => items.join(''))}
        </ul>
        <h4>${wordsByLetterTitle}</h4>
        <table>
            <tr>
                <th>Letter</th>
                <th>Count</th>
            </tr>
            ${Object.entries(wordsByInitialLetter).filter(([letter, count]) => count > 0).map(([letter, count]) => `
                <tr>
                    <td>${letter}</td>
                    <td>${count}</td>
                </tr>
            `).join('')}
        </table>
        <button id="dict-close-statistics-button" class="btn">${closeStatsText}</button>
    `;
    
    const popupOverlay = document.getElementById('popup-overlay');
    const infoClose = document.getElementById('dict-close-statistics-button');

    await statisticsPopup.classList.add('active');
    await statisticsPopup.classList.remove('hidden');
    await popupOverlay.classList.add('active');
    await popupOverlay.classList.remove('hidden');
    await infoClose.classList.add('active');
    await infoClose.classList.remove('hidden');

    infoClose.addEventListener('click', async () => {
        await statisticsPopup.classList.remove('active');
        await statisticsPopup.classList.add('hidden');
        await popupOverlay.classList.remove('active');
        await popupOverlay.classList.add('hidden');
        await infoClose.classList.remove('active');
        await infoClose.classList.add('hidden');
    });
}
