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

// Function to censor text
export function censorText(text) {
    if (!censoringEnabled) {
        return text; // If censorship is disabled, return the text as is
    }
    offensiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        text = text.replace(regex, `<span class="censored" onclick="revealText(this)">${word}</span>`);
    });
    return text;
}

// Function to uncensor text
export function uncensorText(text) {
    // Remove the censor elements and leave plain text, preserving the case
    const regex = /<span class="censored"[^>]*>(.*?)<\/span>/gi;
    return text.replace(regex, '$1');
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
                const originalWordText = censoringEnabled ? censorText(wordElement.innerHTML) : uncensorText(wordElement.innerHTML);
                wordElement.innerHTML = await highlight(originalWordText);
            }
            if (metaElement) {
                const originalMetaText = censoringEnabled ? censorText(metaElement.innerHTML) : uncensorText(metaElement.innerHTML);
                metaElement.innerHTML = await highlight(originalMetaText);
            }
            if (notesElement) {
                const originalNotesText = censoringEnabled ? censorText(notesElement.innerHTML) : uncensorText(notesElement.innerHTML);
                notesElement.innerHTML = await highlight(originalNotesText);
            }
        });
    } catch (error) {
       await captureError(`Error in updateDictionaryBoxes: ${error.message}`);
    }
}

// Event Listener for toggle Censorship
export function initCensoring() {
    try {
        // Add event listener for the toggle button
        document.addEventListener("DOMContentLoaded", function() {
            const toggleButton = document.getElementById('dict-toggle-censorship');
            if (toggleButton) {
                toggleButton.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent the button click from bubbling up
                    censoringEnabled = !censoringEnabled; // This will invert the censoringEnabled flag
                    updateDictionaryBoxes(); // Update the boxes after toggling the flag
                });
            }
        });
    } catch (error) {
        await captureError(`Error in initCensoring: ${error.message}`);
    }
}
