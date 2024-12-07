import { filterAndDisplayWord } from './dictSearch.js';

export function initAdvancedSearchPopup() {
    // Popup window functionality for advanced search
    document.getElementById('advanced-search-button').addEventListener('click', () => {
        document.getElementById('advanced-search-popup').classList.add('active');
        document.getElementById('popup-overlay').classList.add('active');
    });

    document.getElementById('close-popup-button').addEventListener('click', () => {
        document.getElementById('advanced-search-popup').classList.remove('active');
        document.getElementById('popup-overlay').classList.remove('active');
    });

    document.getElementById('apply-search-button').addEventListener('click', () => {
        const searchTerm = document.getElementById('search-input').value.trim();
        filterAndDisplayWord(searchTerm, '', '');
        document.getElementById('advanced-search-popup').classList.remove('active');
        document.getElementById('popup-overlay').classList.remove('active');
    });

    // Ensure all checkboxes are checked by default
    const searchInWord = document.getElementById('search-in-word');
    const searchInRoot = document.getElementById('search-in-root');
    const searchInDefinition = document.getElementById('search-in-definition');
    const searchInEtymology = document.getElementById('search-in-etymology');

    if (searchInWord) searchInWord.checked = true;
    if (searchInRoot) searchInRoot.checked = true;
    if (searchInDefinition) searchInDefinition.checked = true;
    if (searchInEtymology) searchInEtymology.checked = true;
}

export function initStatisticsPopup(allRows) {
    // Statistics popup functionality
    document.getElementById('view-statistics-button').addEventListener('click', () => {
        const totalWords = allRows.filter(row => row.type === 'word').length;
        const totalRoots = allRows.filter(row => row.type === 'root').length;

        const partOfSpeechCounts = allRows.reduce((counts, row) => {
            if (row.type === 'word' && row.partOfSpeech) {
                counts[row.partOfSpeech] = (counts[row.partOfSpeech] || 0) + 1;
            }
            return counts;
        }, {});

        const statisticsContainer = document.getElementById('statistics');
        statisticsContainer.innerHTML = `
            <h3>Statistics</h3>
            <p>Total Words: ${totalWords}</p>
            <p>Total Roots: ${totalRoots}</p>
            <h4>Total Words per Part of Speech:</h4>
            <ul>
                ${Object.entries(partOfSpeechCounts).map(([pos, count]) => `<li>${pos}: ${count}</li>`).join('')}
            </ul>
            <button id="close-statistics-button" class="btn">Close</button>
        `;

        statisticsContainer.classList.add('active');
        document.getElementById('popup-overlay').classList.add('active');

        document.getElementById('close-statistics-button').addEventListener('click', () => {
            statisticsContainer.classList.remove('active');
            document.getElementById('popup-overlay').classList.remove('active');
        });
    });
}
