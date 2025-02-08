import { highlight, createHyperlink } from './utils.js';
import { captureError } from './errorModule.js';
import { getTranslatedText } from './loadTexts.js';

// List of offensive words (add as many words as needed)
const offensiveWords = [
    'tree', 'arbeon', 'she', 'ella',
    'offensiveWord5', 'offensiveWord6', 'offensiveWord7', 'offensiveWord8',
    'offensiveWord9', 'offensiveWord10', 'offensiveWord11', 'offensiveWord12',
    'offensiveWord13', 'offensiveWord14', 'offensiveWord15', 'offensiveWord16',
    'offensiveWord17', 'offensiveWord18', 'offensiveWord19', 'offensiveWord20',
    'offensiveWord21', 'offensiveWord22', 'offensiveWord23', 'offensiveWord24',
    'offensiveWord25', 'offensiveWord26', 'offensiveWord27', 'offensiveWord28',
    'offensiveWord29', 'offensiveWord30', 'offensiveWord31', 'offensiveWord32'
];

// Flag to enable/disable censorship
let censoringEnabled = true;

// Censoring function
export function censorText(text) {
    if (!censoringEnabled) {
        // Remove the censor elements and leave plain text
        const regex = /<span class="censored"[^>]*>(.*?)<\/span>/gi;
        return text.replace(regex, '$1');
    }
    offensiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        text = text.replace(regex, `<span class="censored">${word}</span>`);
    });
    return text;
}

// Function to update the content of all dictionary boxes
export async function updateDictionaryBoxes() {
    try {

        console.log('trying to get all boxes'); 
        const boxes = document.querySelectorAll('.dictionary-box');
        boxes.forEach(async (box) => {
            console.log(box);
            const wordElement = box.querySelector('.dictionary-box-title');
            const metaElement = box.querySelector('.dictionary-box-meta');
            const notesElement = box.querySelector('.dictionary-box-notes');

            if (wordElement) {
                const originalWordText = wordElement.innerHTML;
                wordElement.innerHTML = await highlight(censorText(originalWordText));
            }
            if (metaElement) {
                const originalMetaText = metaElement.innerHTML;
                metaElement.innerHTML = await highlight(censorText(originalMetaText));
            }
            if (notesElement) {
                const originalNotesText = notesElement.innerHTML;
                notesElement.innerHTML = await highlight(censorText(originalNotesText));
            }

            // Ensure the morph element remains as it was before
            const morphElement = box.querySelector('.dictionary-box-morph');
            if (morphElement) morphElement.innerHTML = box.querySelector('.dictionary-box-morph')?.innerHTML || '';
        });
    } catch (error) {
        await captureError(`Error in updateDictionaryBoxes: ${error.message}`);
    }
}

// Event Listener for toggle Censorship
export async function initCensoring() {
    try {
        // Add event listener for the toggle button
            const toggleButton = document.getElementById('dict-toggle-censorship');
            if (toggleButton) {
                console.log('Censor Button Working') 
                toggleButton.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Prevent the button click from bubbling up
                    censoringEnabled = !censoringEnabled; // This will invert the censoringEnabled flag
                    await updateDictionaryBoxes(); // Update the boxes after toggling the flag
                });
            };
    } catch (error) {
       await captureError(`Error in initCensoring: ${error.message}`);
    }
}
