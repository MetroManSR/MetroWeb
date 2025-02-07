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

// Function to reveal censored text
function revealText(element) {
    element.classList.remove('censored');
    element.style.backgroundColor = 'transparent';
    element.style.color = 'inherit';
    element.style.cursor = 'default';
    element.onclick = () => recensorText(element); // Add click event to re-censor
}

// Function to recensor text
function recensorText(element) {
    element.classList.add('censored');
    element.style.backgroundColor = 'black';
    element.style.color = 'black';
    element.style.cursor = 'pointer';
    element.onclick = () => revealText(element); // Add click event to reveal text again
}

// Censoring function
export function censorText(text) {
    if (!censoringEnabled) {
        // Remove any special formatting if censoring is disabled
        const regex = /<span class="censored"[^>]*>(.*?)<\/span>/gi;
        return text.replace(regex, '$1');
    }
    offensiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        text = text.replace(regex, `<span class="censored" onclick="revealText(this)">${word}</span>`);
    });
    return text;
}

// Function to update the content of all dictionary boxes
export async function updateDictionaryBoxes() {
    try {
        const boxes = document.querySelectorAll('.dictionary-box');
        boxes.forEach(async (box) => {
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
        });
    } catch (error) {
        captureError(`Error in updateDictionaryBoxes: ${error.message}`);
    }
}

// Event Listener for toggle Censoring
export function initCensoring() {
    try {
        // Add event listener for the toggle button
        const toggleButton = document.getElementById('dict-toggle-censorship');
        if (toggleButton) {
            toggleButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the button click from bubbling up
                censoringEnabled = !censoringEnabled;
                updateDictionaryBoxes();
            });
        }
    } catch (error) {
        captureError(`Error in initCensoring: ${error.message}`);
    }
}

