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
        //console.log('ES Words:', esWords); // Debugging

        const enWordsResponse = await fetch('https://raw.githubusercontent.com/Hesham-Elbadawi/list-of-banned-words/master/en');
        if (!enWordsResponse.ok) {
            throw new Error(`Failed to fetch English offensive words: ${enWordsResponse.statusText}`);
        }
        const enWordsText = await enWordsResponse.text();
        const enWords = enWordsText.split('\n').map(word => word.trim()).filter(word => word.length > 0);
        //console.log('EN Words:', enWords); // Debugging

        offensiveWords = [...esWords, ...enWords];
        //console.log('Offensive Words:', offensiveWords); // Debugging
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
    element.style.backgroundColor = 'gray';
    element.style.color = 'gray';
    element.style.cursor = 'pointer';
    element.onclick = () => revealText(element); // Add click event to reveal text again
}

// Function to censor text while preserving original formatting
export function censorText(text) {
    if (!censoringEnabled) {
        return text; // If censorship is disabled, return the text as is
    }
    //console.log('Original Text:', text); // Debugging
    offensiveWords.forEach(word => {
        const regex = new RegExp(`(${word})(?!([^<]+)?>)`, 'gi'); // Ensure it doesn't match within HTML tags
        text = text.replace(regex, `<span class="censored" onclick="revealText(this)">$1</span>`);
    });
    //console.log('Censored Text:', text); // Debugging
    return text;
}

// Function to uncensor text while preserving original formatting
export function uncensorText(text) {
    // Remove the censor elements and leave plain text, preserving the case
    const regex = /<span class="censored"[^>]*>(.*?)<\/span>/gi;
    const uncensoredText = text.replace(regex, '$1');
    //console.log('Uncensored Text:', uncensoredText); // Debugging
    return uncensoredText;
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
                //console.log('Original Word Text:', originalWordText); // Debugging
                const processedWordText = censoringEnabled ? censorText(originalWordText) : uncensorText(originalWordText);
                //console.log('Processed Word Text:', processedWordText); // Debugging
                wordElement.innerHTML = await highlight(processedWordText);
                wordElement.querySelectorAll('.censored').forEach(el => {
                    el.onclick = () => revealText(el);
                });
            }
            if (metaElement) {
                const originalMetaText = metaElement.innerHTML;
                //console.log('Original Meta Text:', originalMetaText); // Debugging
                const processedMetaText = censoringEnabled ? censorText(originalMetaText) : uncensorText(originalMetaText);
                //console.log('Processed Meta Text:', processedMetaText); // Debugging
                metaElement.innerHTML = await highlight(processedMetaText);
                metaElement.querySelectorAll('.censored').forEach(el => {
                    el.onclick = () => revealText(el);
                });
            }
            if (notesElement) {
                const originalNotesText = notesElement.innerHTML;
                //console.log('Original Notes Text:', originalNotesText); // Debugging
                const processedNotesText = censoringEnabled ? censorText(originalNotesText) : uncensorText(originalNotesText);
                //console.log('Processed Notes Text:', processedNotesText); // Debugging
                notesElement.innerHTML = await highlight(processedNotesText);
                notesElement.querySelectorAll('.censored').forEach(el => {
                    el.onclick = () => revealText(el);
                });
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
    } catch (error) {
        await captureError(`Error in initCensoring: ${error}`);
    }
}
