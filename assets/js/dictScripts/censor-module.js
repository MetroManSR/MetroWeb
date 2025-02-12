import { highlight, createHyperlink } from './utils.js';
import { captureError } from './errorModule.js';
import { getTranslatedText } from './loadTexts.js';

// Flag to enable/disable censorship
let censoringEnabled = true;
let offensiveWords = [];

// Function to load offensive words from GitHub
async function loadOffensiveWords() {
    try {
        const esWordsResponse = await fetch('https://raw.githubusercontent.com/Hesham-Elbadawi/list-of-banned-words/master/es');
        if (!esWordsResponse.ok) {
            throw new Error(`Failed to fetch Spanish offensive words: ${esWordsResponse.statusText}`);
        }
        const esWordsText = await esWordsResponse.text();
        const esWords = esWordsText.split('\n').map(word => word.trim()).filter(word => word.length > 0);

        const enWordsResponse = await fetch('https://raw.githubusercontent.com/Hesham-Elbadawi/list-of-banned-words/master/en');
        if (!enWordsResponse.ok) {
            throw new Error(`Failed to fetch English offensive words: ${enWordsResponse.statusText}`);
        }
        const enWordsText = await enWordsResponse.text();
        const enWords = enWordsText.split('\n').map(word => word.trim()).filter(word => word.length > 0);

        offensiveWords = [...esWords, ...enWords];
        console.log('Offensive Words:', offensiveWords);
    } catch (error) {
        await captureError(`Error loading offensive words: ${error}`);
    }
}

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

            // Ensure the morph element remains as it was before
            const morphElement = box.querySelector('.dictionary-box-morph');
            if (morphElement) morphElement.innerHTML = box.querySelector('.dictionary-box-morph')?.innerHTML || '';
        });
    } catch (error) {
        await captureError(`Error in updateDictionaryBoxes: ${error}`);
    }
}

// Event Listener for toggle Censorship
export async function initCensoring() {
    try {
        // Add event listener for the toggle button
        document.addEventListener("DOMContentLoaded", async function() {
            const toggleButton = document.getElementById('dict-toggle-censorship');
            if (toggleButton) {
                toggleButton.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Prevent the button click from bubbling up
                    censoringEnabled = !censoringEnabled; // This will invert the censoringEnabled flag
                    await updateDictionaryBoxes(); // Await the update of boxes after toggling the flag
                });
            }

            // Load offensive words and update dictionary boxes
            await loadOffensiveWords();
            console.log('Offensive Words Loaded:', offensiveWords);
            await updateDictionaryBoxes();
        });
    } catch (error) {
        await captureError(`Error in initCensoring: ${error}`);
    }
}
