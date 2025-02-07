import { copyToClipboard, createHyperlink } from './utils.js';
import { getTranslatedText } from './loadTexts.js';
import { universalPendingChanges} from './initFormEventListeners.js';
import { captureError } from './errorModule.js';

let previouslySelectedBox = null;
let lastClickTime = 0;

export async function loadInfoBox(box, row) {  
        
    const language = document.querySelector('meta[name="language"]').content || 'en';

    // Info button
    const infoButton = document.createElement('button');
    infoButton.className = 'info-button';
    infoButton.innerHTML = 'ℹ️';

    // Container for additional icons
    const iconContainer = document.createElement('div');
    iconContainer.className = 'icon-container';
    iconContainer.style.display = 'none';

    // Warning icon
    const warningIcon = document.createElement('button');
    warningIcon.className = 'warning-icon';
    warningIcon.innerHTML = '⚠️';
    warningIcon.title = 'Report error';

    // Exclamation icon
    const suggestionIcon = document.createElement('button');
    suggestionIcon.className = 'suggestion-icon';
    suggestionIcon.innerHTML = '❗';
    suggestionIcon.title = 'Suggestion';

    // Add event listeners
    warningIcon.addEventListener('click', async () => {
        const message = `${await getTranslatedText('bugCopyPaste01', language)}${row.title} [${row.id}]${await getTranslatedText('bugCopyPaste02', language)}`;
        copyToClipboard(message);
        showTooltip('Copied to clipboard! Paste this in the help channel of the discord server of Balkeon.');
    });

    suggestionIcon.addEventListener('click', async () =>  {
        const message = `${await getTranslatedText('ideaCopyPaste01',  language)}${row.title} [${row.id}]${await getTranslatedText('ideaCopyPaste02', language)}`;
        copyToClipboard(message);
        showTooltip('Copied to clipboard! Paste this in the help channel of the discord server of Balkeon.');
    });

    // Append icons to container
    iconContainer.appendChild(warningIcon);
    iconContainer.appendChild(suggestionIcon);

    // Toggle icon visibility on info button click
    infoButton.addEventListener('click', () => {
        iconContainer.style.display = iconContainer.style.display === 'none' ? 'flex' : 'none';
    });

    // Append the info button and icon container to the box
    box.appendChild(infoButton);
    box.appendChild(iconContainer);
}

/**
 * Event listener for clicks on dictionary boxes.
 *
 * @param {Array} allRows - Array containing all dictionary rows.
 * @param {string} language - Language for translation.
 * @param {Object} pendingChanges - Object containing pending changes.
 */
export async function boxClickListener(allRows, language, pendingChanges) {
    // Ensure pendingChanges is initialized
    if (!pendingChanges || Object.keys(pendingChanges).length === 0) {
        pendingChanges = universalPendingChanges || defaultPendingChanges;
    }

    // Set searchTerm if not present
    pendingChanges.searchTerm = pendingChanges.searchTerm || '';

    //console.log('Initializing Box Click Event Listener');

    async function handleClickEvent(e) {
        const now = Date.now();
        if (now - lastClickTime < 250) return; // 0.25 second cooldown
        lastClickTime = now;

        const target = e.target;
        if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('.icon-container')) {
            return; // Ignore clicks on links, buttons, and the icon container
        }

        e.stopPropagation(); // Stop event propagation to avoid duplicate events
        e.preventDefault();  // Prevent default action to ensure correct handling

        // Find the closest .dictionary-box element
        const box = target.closest('.dictionary-box');
        if (!box) return;

        // Ensure the previous related words section is removed
        if (previouslySelectedBox && previouslySelectedBox === box) {
            previouslySelectedBox.classList.remove('selected-word', 'selected-root');
            const previousRelatedWords = previouslySelectedBox.querySelector('.related-words');
            if (previousRelatedWords) {
                previouslySelectedBox.removeChild(previousRelatedWords);
            }
            previouslySelectedBox = null;
            return;
        } else if (previouslySelectedBox) {
            previouslySelectedBox.classList.remove('selected-word', 'selected-root');
            const previousRelatedWords = previouslySelectedBox.querySelector('.related-words');
            if (previousRelatedWords) {
                previouslySelectedBox.removeChild(previousRelatedWords);
            }
        }

        // Extract the type and row ID from the box's ID attribute
        const [type, id] = box.id.split('-');
        const rowId = parseInt(id, 10);
        const row = allRows.find(r => r.id === rowId && r.type === type);

        if (!row) {
            console.error(`Row with id ${rowId} and type ${type} not found.`);
            return;
        }

        box.classList.add(row.type === 'root' ? 'selected-root' : 'selected-word');

        const relatedWordsElement = document.createElement('div');
        relatedWordsElement.className = 'related-words';
        relatedWordsElement.style.fontSize = '0.85em';

        let derivativeWordsLabel = '';
        let relatedWordsLabel = '';

        if (row.type === 'root') {
            derivativeWordsLabel = await getTranslatedText('derivativeWords', language);
            if (row.related && row.related.length > 0) {
                //console.log('Derivatives:', row.related); // Debugging

                // Ensure the displayed word is not shown as a related word
                const relatedWordsHtml = await Promise.all(row.related
                    .filter(dw => dw.toLowerCase() !== row.title.toLowerCase())
                    .map(async (dw) => {
                        // Find the related word in the allRows array
                        const relatedWord = typeof dw === 'string' ? allRows.find(r => r.title.trim().toLowerCase() === dw.trim().toLowerCase()) : dw;

                        // Log for debugging
                        //console.log('Derivative word:', dw, 'Related word:', relatedWord);

                        // Return just the hyperlinked text
                        return relatedWord ? await createHyperlink(relatedWord.title, pendingChanges.searchTerm, allRows) : dw;
                    }));

                relatedWordsElement.innerHTML = `<strong>${derivativeWordsLabel} (${relatedWordsHtml.length}):</strong> ${relatedWordsHtml.join(', ')}`;
            } else {
                relatedWordsElement.innerHTML = `<strong>${derivativeWordsLabel}:</strong> ${await getTranslatedText('noneFound', language)}`;
            }
        } else {
            relatedWordsLabel = await getTranslatedText('relatedWords', language);
            const relatedWords = row.related || [];

            if (relatedWords.length > 0) {
                //console.log('Related Words:', relatedWords); // Debugging

                // Create arrays for each morph
                const morphArrays = row.morph.reduce((acc, morph) => {
                    acc[morph] = [];
                    return acc;
                }, {});

                // Classify related words into respective morphs
                for (const relatedWord of relatedWords) {
                    const word = allRows.find(r => r.title.trim().toLowerCase() === relatedWord.trim().toLowerCase() && r.title.trim().toLowerCase() !== row.title.trim().toLowerCase());
                    if (word) {
                        for (const morph of word.morph) {
                            if (morphArrays[morph]) {
                                morphArrays[morph].push(word);
                            }
                        }
                    }
                }

                // Join arrays for the general overview and remove duplicates
                const generalOverviewArray = Object.values(morphArrays).flat().reduce((acc, word) => {
                    if (!acc.find(w => w.id === word.id)) {
                        acc.push(word);
                    }
                    return acc;
                }, []);

                const generalOverviewHtml = await Promise.all(generalOverviewArray.map(async (r) => {
                    return await createHyperlink(r.title, pendingChanges.searchTerm, allRows);
                }));

                const generalOverviewContainer = document.createElement('div');
                generalOverviewContainer.innerHTML = `<strong>${relatedWordsLabel} (${generalOverviewHtml.length}):</strong> ${generalOverviewHtml.join(', ')}`;

                if (generalOverviewContainer.childElementCount > 15) {
                    generalOverviewContainer.classList.add('scrollable-box');
                }

                relatedWordsElement.appendChild(generalOverviewContainer);

                // Add buttons for each morph if more than one
                if (row.morph && row.morph.length > 1) {
                    console.log('Morph length is greater than 1:', row.morph); // Debugging
                    const morphButtonsElement = document.createElement('div');
                    morphButtonsElement.className = 'morph-buttons dict-buttons'; // Add the dict-buttons class

                    for (const morph of row.morph) {
                        //console.log('Creating button for morph:', morph); // Debugging
                        const morphButton = document.createElement('button');
                        morphButton.innerText = morph;
                        morphButton.classList.add('btn'); // Add the dict-buttons class
                        morphButton.style.display = 'inline-block'; // Ensure buttons are displayed inline
                        morphButton.addEventListener('click', async (event) => {
                            event.stopPropagation();
                           // console.log('Clicked morph button:', morph); // Debugging
                            const morphRelatedWords = await Promise.all(morphArrays[morph].map(async (r) => {
                                return await createHyperlink(r.title, pendingChanges.searchTerm, allRows);
                            }));

                            const morphRelatedWordsElement = document.createElement('div');
                            morphRelatedWordsElement.innerHTML = `<strong>${relatedWordsLabel} (${morphRelatedWords.length}):</strong> ${morphRelatedWords.join(', ')}`;

                            if (morphRelatedWordsElement.childElementCount > 15) {
                                morphRelatedWordsElement.classList.add('scrollable-box');
                            }

                            // Ensure buttons are not removed when specific morph related words are displayed
                            relatedWordsElement.innerHTML = '';
                            relatedWordsElement.appendChild(morphButtonsElement); // Re-add buttons to keep them visible
                            relatedWordsElement.appendChild(morphRelatedWordsElement);
                        });
                        morphButtonsElement.appendChild(morphButton);
                    }
                    relatedWordsElement.insertBefore(morphButtonsElement, relatedWordsElement.firstChild); // Add buttons to the top
                }

            } else {
                relatedWordsElement.innerHTML = `<strong>${relatedWordsLabel}:</strong> ${await getTranslatedText('noneFound', language)}`;
            }
        }

        // Add tooltip for meta information on hover
        relatedWordsElement.querySelectorAll('a').forEach(link => {
            const relatedWordTitle = link.textContent.trim().toLowerCase();
            const relatedWord = allRows.find(r => r.title.trim().toLowerCase() === relatedWordTitle);
            if (relatedWord) {
                link.title = relatedWord.meta || '';
            }
        });

        box.appendChild(relatedWordsElement);

        previouslySelectedBox = box;
    }

    const dictionaryContainer = document.getElementById('dict-dictionary');
    dictionaryContainer.addEventListener('click', handleClickEvent, true); // Use capturing phase

    console.log('Initialized Box Click Event Listener');
}

// Function to display tooltip message
function showTooltip(message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerText = message;
    document.body.appendChild(tooltip);

    setTimeout(() => {
        tooltip.remove();
    }, 3000);
}
