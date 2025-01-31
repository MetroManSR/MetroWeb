import { getRelatedWordsByRoot, highlight, createHyperlink } from './utils.js';
import { updatePagination } from './pagination.js';
import { getTranslatedText } from './loadTexts.js';
import { loadInfoBox } from './boxEvents.js';
import { filteredRows } from '../mainDict.js';
import { universalPendingChanges } from './initFormEventListeners.js';

let previouslySelectedBox = null;

// Cache frequently used translations
const translationCache = {};

/**
 * Gets the part of speech abbreviation based on the language.
 * @param {string} partOfSpeech - The part of speech.
 * @param {string} language - The language code.
 * @returns {string} - The abbreviated part of speech.
 */
function getPartOfSpeechAbbreviation(partOfSpeech, language) {
    const posAbbreviations = {
        en: {
            noun: 'n.',
            verb: 'v.',
            adjective: 'adj.',
            adverb: 'adv.',
            pronoun: 'pron.',
            preposition: 'prep.',
            conjunction: 'conj.',
            interjection: 'int.'
        },
        es: {
            noun: 's.',
            verb: 'v.',
            adjective: 'adj.',
            adverb: 'adv.',
            pronoun: 'pron.',
            preposition: 'prep.',
            conjunction: 'conj.',
            interjection: 'int.'
        }
    };

    return posAbbreviations[language]?.[partOfSpeech.toLowerCase()] || partOfSpeech;
}

/**
 * Creates a dictionary box for a given row.
 * @param {Object} row - The dictionary row.
 * @param {Array} allRows - All dictionary rows.
 * @param {string} searchTerm - The search term.
 * @param {boolean} exactMatch - Whether to perform an exact match.
 * @param {Object} searchIn - Fields to search within.
 * @returns {Promise<HTMLElement>} - The dictionary box element.
 */
export async function createDictionaryBox(row, allRows, searchTerm, exactMatch, searchIn) {
    if (!row || !row.title) {
        console.error('Invalid row data:', row);
        return null;
    }

    const box = document.createElement('div');
    box.classList.add('dictionary-box');
    box.id = `${row.type}-${row.id}`;

    if (row.type === 'root') {
        box.classList.add('root-word');
    }

    const language = document.querySelector('meta[name="language"]').content || 'en';
    const partOfSpeechAbbr = getPartOfSpeechAbbreviation(row.partofspeech || '', language);

    // Create title element
    const wordElement = document.createElement('div');
    wordElement.classList.add('dictionary-box-title');
    wordElement.innerHTML = await highlight(
        row.title + (row.type !== 'root' ? ` (${partOfSpeechAbbr})` : ''),
        searchTerm,
        searchIn,
        row
    );

    // Create meta element
    const metaElement = document.createElement('div');
    metaElement.classList.add('dictionary-box-meta');
    metaElement.innerHTML = await highlight(row.meta, searchTerm, searchIn, row);

    // Create content box
    const contentBox = document.createElement('div');
    contentBox.classList.add('dictionary-box-content');

    // Add meta and notes
    if (row.type === 'root') {
        metaElement.innerHTML = `<strong>${await getTranslatedText('translation', language)}:</strong> ${await highlight(row.meta, searchTerm, searchIn, row)}`;
        const notesElement = document.createElement('div');
        notesElement.classList.add('dictionary-box-notes');
        notesElement.innerHTML = `<strong>${await getTranslatedText('notes', language)}:</strong> ${await highlight(row.notes || '', searchTerm, searchIn, row)}`;
        contentBox.appendChild(metaElement);
        contentBox.appendChild(notesElement);
    } else {
        metaElement.innerHTML = `<strong>${await getTranslatedText('translation', language)}:</strong> ${await highlight(row.meta, searchTerm, searchIn, row)}`;
        const notesElement = document.createElement('div');
        notesElement.classList.add('dictionary-box-notes');
        notesElement.innerHTML = `<strong>${await getTranslatedText('notes', language)}:</strong> ${await highlight(row.notes || '', searchTerm, searchIn, row)}`;
        contentBox.appendChild(metaElement);
        contentBox.appendChild(notesElement);

        // Add morphology if available
        if (Array.isArray(row.morph) && row.morph.length > 0) {
            const morphElement = document.createElement('div');
            morphElement.classList.add('dictionary-box-morph');
            const morphLinks = await Promise.all(row.morph.map(async (morphTitle) => {
                const matchingRoot = allRows.find(r => r.meta.toLowerCase() === morphTitle.toLowerCase() && r.type === 'root');
                return matchingRoot
                    ? await createHyperlink(morphTitle, searchTerm, allRows, searchIn)
                    : await highlight(morphTitle, searchTerm, searchIn, row);
            }));
            morphElement.innerHTML = `<strong>${await getTranslatedText('morphology', language)}:</strong> ${morphLinks.join(', ')}`;
            contentBox.appendChild(morphElement);
        }
    }

    // Add type tag
    const typeTag = document.createElement('span');
    typeTag.classList.add('type-tag');
    typeTag.textContent = row.type === 'root' ? await getTranslatedText('root', language) : await getTranslatedText('word', language);
    typeTag.style.position = 'absolute';
    typeTag.style.top = '10px';
    typeTag.style.right = '10px';

    // Add ID display
    const idElement = document.createElement('div');
    idElement.className = 'id-display';
    idElement.textContent = `${await getTranslatedText('id', language)}: ${row.id}`;
    idElement.style.position = 'absolute';
    idElement.style.bottom = '10px';
    idElement.style.right = '10px';

    // Append elements to the box
    box.appendChild(typeTag);
    box.appendChild(wordElement);
    box.appendChild(contentBox);
    box.appendChild(idElement);

    // Add fade-in effect
    setTimeout(() => {
        box.classList.add('fade-in');
    }, 100);

    // Load info box
    await loadInfoBox(box, row);

    return box;
}

/**
 * Creates a "no match" box with suggestions.
 * @param {string} language - The language code.
 * @param {string} searchTerm - The search term.
 * @param {Array} allRows - All dictionary rows.
 * @returns {Promise<HTMLElement>} - The "no match" box element.
 */
export async function createNoMatchBox(language, searchTerm, allRows) {
    const noMatchBox = document.createElement('div');
    noMatchBox.className = 'dict-no-match-box';

    const noMatchText = document.createElement('div');
    noMatchText.textContent = await getTranslatedText('noMatch', language);
    noMatchBox.appendChild(noMatchText);

    // Calculate suggestions
    const suggestions = allRows
        .map(row => ({
            title: row.title,
            similarity: getSimilarity(row.title, searchTerm),
            metaSimilarity: row.meta ? getSimilarity(row.meta, searchTerm) : 0
        }))
        .map(row => ({
            ...row,
            displayText: row.similarity > row.metaSimilarity ? row.title : (row.meta || ''),
            totalSimilarity: Math.max(row.similarity, row.metaSimilarity)
        }))
        .sort((a, b) => b.totalSimilarity - a.totalSimilarity)
        .slice(0, 20);

    if (suggestions.length > 0) {
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'dict-suggestions-container';

        const suggestionsTitle = document.createElement('div');
        suggestionsTitle.textContent = await getTranslatedText('maybeYouMeant', language);
        suggestionsContainer.appendChild(suggestionsTitle);

        const suggestionsParagraph = document.createElement('p');

        for (const { displayText, totalSimilarity } of suggestions) {
            const suggestionLink = document.createElement('span');
            const percentage = (totalSimilarity * 100).toFixed(2);
            const color = `rgb(${255 - totalSimilarity * 255}, ${totalSimilarity * 255}, 0)`; // Shades of green and red
            suggestionLink.innerHTML = `<div style="background-color: ${color}; cursor: pointer;">${displayText} (${percentage}%)</div>`;
            suggestionLink.className = 'dict-suggestion-link';
            suggestionLink.style.marginRight = '10px';

            suggestionLink.addEventListener('click', () => {
                const searchInput = document.getElementById('dict-search-input');
                searchInput.value = displayText;
                noMatchBox.innerHTML = '';
            });

            suggestionsParagraph.appendChild(suggestionLink);
        }

        suggestionsContainer.appendChild(suggestionsParagraph);
        noMatchBox.appendChild(suggestionsContainer);
    }

    return noMatchBox;
}

/**
 * Creates a loading box.
 * @returns {HTMLElement} - The loading box element.
 */
export function createLoadingBox() {
    const loadingBox = document.createElement('div');
    loadingBox.className = 'dictionary-box loading';
    loadingBox.textContent = "Loading...";
    return loadingBox;
}

/**
 * Updates the floating text with search and filter information.
 * @param {string} searchTerm - The search term.
 * @param {Array} filters - The applied filters.
 * @param {Object} advancedSearchParams - Advanced search parameters.
 * @param {string} language - The language code.
 */
export async function updateFloatingText(searchTerm, filters, advancedSearchParams, language) {
    let floatingTextContent = `${filteredRows.length} ${await getTranslatedText('wordsFound', language)}`;

    if (searchTerm) {
        floatingTextContent += ` ${await getTranslatedText('whenLookingFor', language)} "${searchTerm}"`;
    }
    if (filters.length > 0) {
        const translatedFilters = await Promise.all(filters.map(async filter => {
            return await getTranslatedText(filter, language);
        }));
        floatingTextContent += ` ${await getTranslatedText('withFilters', language)}: ${translatedFilters.join(", ")}`;
    }
    if (advancedSearchParams) {
        const translatedAdvancedParams = await Promise.all(Object.keys(advancedSearchParams).map(async param => {
            return await getTranslatedText(param, language);
        }));
        floatingTextContent += ` ${await getTranslatedText('withAdvancedSearch', language)}: ${translatedAdvancedParams.join(", ")}`;
    }

    const floatingText = document.getElementById('dictfloating-info');
    if (floatingText) {
        floatingText.textContent = floatingTextContent;
    } else {
        console.error('Floating text element not found');
    }
}

/**
 * Renders the dictionary boxes for the current page.
 * @param {Array} allRows - All dictionary rows.
 * @param {string} searchTerm - The search term.
 * @param {boolean} exactMatch - Whether to perform an exact match.
 * @param {Object} searchIn - Fields to search within.
 * @param {number} rowsPerPage - Rows per page.
 * @param {number} currentPage - The current page number.
 */
export async function renderBox(allRows, searchTerm, exactMatch, searchIn, rowsPerPage, currentPage = 1) {
    const dictionaryContainer = document.getElementById('dict-dictionary');
    if (!dictionaryContainer) {
        console.error('Dictionary container not found');
        return;
    }

    dictionaryContainer.innerHTML = ''; // Clear previous entries

    const language = document.querySelector('meta[name="language"]').content || 'en';

    // Calculate rows to display
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const rowsToDisplay = filteredRows.slice(start, end);

    // Render loading boxes
    const loadingBoxesMap = new Map();
    rowsToDisplay.forEach(row => {
        const loadingBox = createLoadingBox();
        const uniqueId = `${row.type}-${row.id}`;
        loadingBox.id = `loading-box-${uniqueId}`;
        dictionaryContainer.appendChild(loadingBox);
        loadingBoxesMap.set(uniqueId, loadingBox);
    });

    if (filteredRows.length === 0) {
        dictionaryContainer.appendChild(await createNoMatchBox(language, searchTerm, allRows));
        updatePagination(currentPage, rowsPerPage);
        await updateFloatingText(searchTerm, [], {}, language);
        return;
    }

    // Replace loading boxes with actual content
    for (const row of rowsToDisplay) {
        const box = await createDictionaryBox(row, allRows, searchTerm, exactMatch, searchIn);
        const uniqueId = `${row.type}-${row.id}`;
        const loadingBox = loadingBoxesMap.get(uniqueId);
        if (loadingBox && box) {
            dictionaryContainer.replaceChild(box, loadingBox);
            loadingBoxesMap.delete(uniqueId);
        } else {
            console.warn(`Loading box with ID ${uniqueId} not found or box creation failed.`);
        }
    }

    // Cleanup unused loading boxes
    loadingBoxesMap.forEach(loadingBox => {
        dictionaryContainer.removeChild(loadingBox);
    });

    updatePagination(currentPage, rowsPerPage);
    await updateFloatingText(searchTerm, [], {}, language);
}
