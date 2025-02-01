import { getRelatedWordsByRoot, highlight, createHyperlink } from './utils.js';
import { updatePagination } from './pagination.js';
import { getTranslatedText } from './loadTexts.js';
import { copyToClipboard, getSimilarity, levenshteinDistance, editDistance } from './utils.js';
import { loadInfoBox } from './boxEvents.js';
import { filteredRows } from '../mainDict.js';
import { universalPendingChanges } from './initFormEventListeners.js';
let previouslySelectedBox = null;

// Function to get part of speech abbreviation based on language
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

    return posAbbreviations[language][partOfSpeech.toLowerCase()] || partOfSpeech;
}

// Function to create a dictionary box
export async function createDictionaryBox(row, allRows, searchTerm, exactMatch, searchIn) {
    if (!row || !row.title) {
        console.error('Invalid row data:', row);
        return null;
    }

    const box = document.createElement('div');
    box.classList.add('dictionary-box');
    box.id = `${row.type}-${row.id}`;

    if (row.type === 'root') {
        box.classList.add('root-word'); // Apply root word styling
    }

    const language = document.querySelector('meta[name="language"]').content || 'en'; // Default to 'en' if not specified
    const partOfSpeechAbbr = getPartOfSpeechAbbreviation(row.partofspeech || '', language);

    const wordElement = document.createElement('div');
    wordElement.classList.add('dictionary-box-title');
    wordElement.innerHTML = await highlight(row.title + (row.type !== 'root' ? ` (${partOfSpeechAbbr})` : ''), searchTerm, searchIn, row);

    const hrElement = document.createElement('hr');

    const metaElement = document.createElement('div');
    metaElement.classList.add('dictionary-box-meta');
    metaElement.innerHTML = await highlight(row.meta, searchTerm, searchIn, row);

    const contentBox = document.createElement('div');
    contentBox.classList.add('dictionary-box-content');

    const notesElement = document.createElement('div');
    notesElement.classList.add('dictionary-box-notes');

    const morphElement = document.createElement('div');
    morphElement.classList.add('dictionary-box-morph');

    // Display morphology for words and etymology for roots
    if (row.type === 'root') {
        metaElement.innerHTML = `<strong>${await getTranslatedText('translation', language)}:</strong> ${await highlight(row.meta, searchTerm, searchIn, row)}`;
        notesElement.innerHTML = `<strong>${await getTranslatedText('notes', language)}:</strong> ${await highlight(row.notes || '', searchTerm, searchIn, row)}`;
        morphElement.innerHTML = `<strong>${await getTranslatedText('etymology', language)}:</strong> ${await highlight(row.morph.join(', ') || '', searchTerm, searchIn, row)}`;
        contentBox.appendChild(metaElement);
        contentBox.appendChild(notesElement);
        contentBox.appendChild(morphElement);
    } else {
        metaElement.innerHTML = `<strong>${await getTranslatedText('translation', language)}:</strong> ${await highlight(row.meta, searchTerm, searchIn, row)}`;
        notesElement.innerHTML = `<strong>${await getTranslatedText('notes', language)}:</strong> ${await highlight(row.notes || '', searchTerm, searchIn, row)}`;
        contentBox.appendChild(metaElement);
        contentBox.appendChild(notesElement);

        if (Array.isArray(row.morph) && row.morph.length > 0) {
            morphElement.innerHTML = `<strong>${await getTranslatedText('morphology', language)}:</strong> `;
            const morphLinks = await Promise.all(row.morph.map(async (morphTitle, index) => {
                const matchingRoot = allRows.find(r => r.meta.toLowerCase() === morphTitle.toLowerCase() && r.type === 'root');
                return matchingRoot 
                    ? await createHyperlink(morphTitle, searchTerm, allRows, searchIn) 
                    : await highlight(morphTitle, searchTerm, searchIn, row);
            }));
            morphElement.innerHTML += morphLinks.join(', ');
            contentBox.appendChild(morphElement);
        }
    }

    const typeTag = document.createElement('span');
    typeTag.classList.add('type-tag');
    typeTag.textContent = row.type === 'root' ? await getTranslatedText('root', language) : await getTranslatedText('word', language);
    typeTag.style.position = 'absolute';
    typeTag.style.top = '10px';
    typeTag.style.right = '10px';

    box.style.position = 'relative';  // Ensure the box is relatively positioned

    box.appendChild(typeTag);
    box.appendChild(wordElement);
    box.appendChild(contentBox);

    // Add ID display in bottom right
    const idElement = document.createElement('div');
    idElement.className = 'id-display';
    idElement.textContent = `${await getTranslatedText('id', language)}: ${row.id}`;
    idElement.style.position = 'absolute';
    idElement.style.bottom = '10px';
    idElement.style.right = '10px';

    box.appendChild(idElement);

    // Ensure text does not overlap with type tag or ID box
    wordElement.style.paddingRight = '50px'; // Adjust padding to avoid type tag
    morphElement.style.paddingBottom = '30px'; // Adjust padding to avoid ID box

    await loadInfoBox(box, row);

    // Add fade-in effect
    setTimeout(() => {
        box.classList.add('fade-in');
    }, 100);

    return box;
}

/**
 * Function to create a no match box with suggestions.
 *
 * @param {string} language - The language code for translations.
 * @param {string} searchTerm - The search term entered by the user.
 * @param {Array} allRows - The array of all dictionary rows.
 * @returns {Promise<Element>} - A promise that resolves to the no match box element.
 */
export async function createNoMatchBox(language, searchTerm, allRows) {
    const dictionaryContainer = document.getElementById('dict-dictionary');

    // Check for existing no match box
    const existingNoMatchBox = dictionaryContainer.querySelector('.dict-no-match-box');
    if (existingNoMatchBox) {
        return existingNoMatchBox;
    }

    const noMatchBox = document.createElement('div');
    noMatchBox.className = 'dict-no-match-box';

    const noMatchText = document.createElement('div');
    noMatchText.textContent = await getTranslatedText('noMatch', language);
    noMatchBox.appendChild(noMatchText);

    // Calculate similarities and get the top 20 matching titles
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

            suggestionsParagraph.appendChild(suggestionLink);

            // Add click event to suggestions to paste them into the search input
            suggestionLink.addEventListener('click', () => {
                const searchInput = document.getElementById('dict-search-input');
                searchInput.value = displayText;
                noMatchBox.innerHTML = '';
            });
        }

        suggestionsContainer.appendChild(suggestionsParagraph);
        noMatchBox.appendChild(suggestionsContainer);
    }

    return noMatchBox;
}

// Function to create a loading box
export function createLoadingBox() {
    const loadingBox = document.createElement('div');
    loadingBox.className = 'dictionary-box loading';
    loadingBox.textContent = "Loading..."; // Add some loading text or a spinner
    return loadingBox;
}

function initializeFloatingText() {
    const floatingButton = document.querySelector('.dictfloating-button');
    const floatingText = document.querySelector('.dictfloating-text');
    const floatingInfo = document.getElementById('dictfloating-info');

    floatingButton.addEventListener('click', () => {
        floatingText.classList.toggle('hidden');
        floatingText.classList.toggle('visible');
    });
}

export async function updateFloatingText(pendingChanges, language) {
    try {
        // Initialize the floating text content
        let floatingTextContent = '';

        // Add search term information if provided
        if (pendingChanges.searchTerm) {
            const translatedSearchTerm = await getTranslatedText('searchTerm', language);
            floatingTextContent += `<strong>${translatedSearchTerm}</strong>: "${pendingChanges.searchTerm}"<br>`;
        }

        // Add exact match information if enabled
        if (pendingChanges.exactMatch) {
            const translatedExactMatch = await getTranslatedText('exactMatch', language);
            floatingTextContent += `<strong>${translatedExactMatch}</strong>: ${translatedExactMatch}<br>`;
        }

        // Add search-in fields information if any are enabled
        if (pendingChanges.searchIn) {
            const searchInFields = [];
            if (pendingChanges.searchIn.word) searchInFields.push(await getTranslatedText('searchInWord', language));
            if (pendingChanges.searchIn.root) searchInFields.push(await getTranslatedText('searchInRoot', language));
            if (pendingChanges.searchIn.definition) searchInFields.push(await getTranslatedText('searchInDefinition', language));
            if (pendingChanges.searchIn.etymology) searchInFields.push(await getTranslatedText('searchInEtymology', language));

            if (searchInFields.length > 0) {
                const translatedSearchIn = await getTranslatedText('searchIn', language);
                floatingTextContent += `<strong>${translatedSearchIn}</strong>: ${searchInFields.join(', ')}<br>`;
            }
        }

        // Add ignore diacritics information if enabled
        if (pendingChanges.ignoreDiacritics) {
            const translatedIgnoreDiacritics = await getTranslatedText('ignoreDiacritics', language);
            floatingTextContent += `<strong>${translatedIgnoreDiacritics}</strong><br>`;
        }

        // Add startsWith information if enabled
        if (pendingChanges.startsWith) {
            const translatedStartsWith = await getTranslatedText('startsWith', language);
            floatingTextContent += `<strong>${translatedStartsWith}</strong><br>`;
        }

        // Add endsWith information if enabled
        if (pendingChanges.endsWith) {
            const translatedEndsWith = await getTranslatedText('endsWith', language);
            floatingTextContent += `<strong>${translatedEndsWith}</strong><br>`;
        }

        // Add filters information if any filters are applied
        if (pendingChanges.filters && pendingChanges.filters.length > 0) {
            const translatedFilters = await getTranslatedText('filters', language);
            const translatedFilterValues = await Promise.all(pendingChanges.filters.map(filter => getTranslatedText(filter, language)));
            floatingTextContent += `<strong>${translatedFilters}</strong>: ${translatedFilterValues.join(', ')}<br>`;
        }

        // Add rows per page information if not default
        if (pendingChanges.rowsPerPage !== 20) {
            const translatedRowsPerPage = await getTranslatedText('rowsPerPage', language);
            floatingTextContent += `<strong>${translatedRowsPerPage}</strong>: ${pendingChanges.rowsPerPage}<br>`;
        }

        // Add sort order information if specified
        if (pendingChanges.sortOrder) {
            const translatedSortOrder = await getTranslatedText('sortOrder', language);
            const sortOrderTranslation = await getTranslatedText(pendingChanges.sortOrder, language);
            floatingTextContent += `<strong>${translatedSortOrder}</strong>: ${sortOrderTranslation}<br>`;
        }

        // Update the DOM with the constructed floating text content
        const floatingText = document.getElementById('dictfloating-info');
        if (floatingText) {
            floatingText.innerHTML = floatingTextContent || await getTranslatedText('noPendingChanges', language);
        } else {
            console.error('Floating text element not found');
        }
    } catch (error) {
        console.error('Error updating floating text:', error);
    }
}

export async function renderBox(allRows, searchTerm, exactMatch, searchIn, rowsPerPage, currentPage = 1) {

    if (universalPendingChanges) {

        rowsPerPage = universalPendingChanges.rowsPerPage;

   } 
    
    initializeFloatingText();
    
    //onsole.log(`RenderBox called with currentPage: ${currentPage}, rowsPerPage: ${rowsPerPage}`);

    const dictionaryContainer = document.getElementById('dict-dictionary');
    dictionaryContainer.innerHTML = ''; // Clear previous entries

    const language = document.querySelector('meta[name="language"]').content || 'en';

    //console.log(rowsPerPage) 
    
    // Render the right amount of loading boxes with unique IDs
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const rowsToDisplay = filteredRows.slice(start, end);

    //console.log(`Rows to display: ${rowsToDisplay.length}, Start: ${start}, End: ${end}`);

    // Create a map to associate loading boxes with rows based on type and IDs
    const loadingBoxesMap = new Map();
    rowsToDisplay.forEach(row => {
        const loadingBox = createLoadingBox();
        const uniqueId = `${row.type}-${row.id}`;
        loadingBox.id = `loading-box-${uniqueId}`;
        dictionaryContainer.appendChild(loadingBox);
        loadingBoxesMap.set(uniqueId, loadingBox);
        //console.log(`Appended loading box with ID: ${loadingBox.id}`);
    });

    if (filteredRows.length === 0) {
        dictionaryContainer.innerHTML = ''; // Clear loading boxes
        dictionaryContainer.appendChild(await createNoMatchBox(language, searchTerm, allRows));
        updatePagination(currentPage, rowsPerPage);
        await updateFloatingText(searchTerm, [], {}, language);
        return;
    }

    // Replace loading boxes with actual content based on type and IDs
    for (const row of rowsToDisplay) {
        const box = await createDictionaryBox(row, allRows, searchTerm, exactMatch, searchIn);
        const uniqueId = `${row.type}-${row.id}`;
        const loadingBox = loadingBoxesMap.get(uniqueId);
        if (loadingBox && box) {
            //console.log(`Replacing loading box with ID: ${uniqueId}`);
            dictionaryContainer.replaceChild(box, loadingBox);
            loadingBoxesMap.delete(uniqueId); // Remove the entry from the map as it's been used
        } else {
            console.warn(`Loading box with ID ${uniqueId} not found or box creation failed.`);
        }
    }

    // Cleanup unused loading boxes
    loadingBoxesMap.forEach(loadingBox => {
        dictionaryContainer.removeChild(loadingBox);
        //console.log(`Removed unused loading box with ID: ${loadingBox.id}`);
    });

    updatePagination(currentPage, rowsPerPage);
    await updateFloatingText(searchTerm, [], {}, language);
}
