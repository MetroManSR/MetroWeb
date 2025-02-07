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
    element.style.backgroundColor = 'transparent';
    element.style.color = 'inherit';
    element.style.cursor = 'default';
    element.onclick = null; // Remove the click event listener
}

// Censoring function
export function censorText(text) {
    if (!censoringEnabled) return text;
    offensiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        text = text.replace(regex, `<span class="censored" onclick="revealText(this)">${word}</span>`);
    });
    return text;
}

// Function to gather all rows dynamically
function getAllRows() {
    const boxes = document.querySelectorAll('.dictionary-box');
    const allRows = Array.from(boxes).map(box => {
        return {
            id: box.id.split('-').pop(),
            title: box.querySelector('.dictionary-box-title')?.textContent || '',
            meta: box.querySelector('.dictionary-box-meta')?.textContent || '',
            notes: box.querySelector('.dictionary-box-notes')?.textContent || '',
            morph: (box.querySelector('.dictionary-box-morph')?.textContent || '').split(','),
            partofspeech: box.getAttribute('data-partofspeech') || '',
            type: box.getAttribute('data-type') || ''
        };
    });
    return allRows;
}

// Function to update the content of all dictionary boxes
export function updateDictionaryBoxes() {
    const allRows = getAllRows();
    const boxes = document.querySelectorAll('.dictionary-box');
    boxes.forEach(async (box) => {
        const rowId = box.id.split('-').pop();
        const row = allRows.find(r => r.id.toString() === rowId);
        if (row) {
            const wordElement = box.querySelector('.dictionary-box-title');
            const metaElement = box.querySelector('.dictionary-box-meta');
            const notesElement = box.querySelector('.dictionary-box-notes');
            const morphElement = box.querySelector('.dictionary-box-morph');

            wordElement.innerHTML = await highlight(censorText(row.title + (row.type !== 'root' ? ` (${partOfSpeechAbbr})` : '')));

            // Update meta element
            metaElement.innerHTML = await highlight(censorText(row.meta));

            // Update notes element
            notesElement.innerHTML = await highlight(censorText(row.notes || ''));

            // Update morph element
            if (Array.isArray(row.morph) && row.morph.length > 0) {
                morphElement.innerHTML = `<strong>${await getTranslatedText('morphology', 'en')}:</strong> `;
                const morphLinks = await Promise.all(row.morph.map(async (morphTitle, index) => {
                    const matchingRoot = allRows.find(r => r.meta.toLowerCase() === morphTitle.toLowerCase() && r.type === 'root');
                    return matchingRoot 
                        ? await createHyperlink(morphTitle) 
                        : await highlight(censorText(morphTitle));
                }));
                morphElement.innerHTML += morphLinks.join(', ');
            }
        }
    });
}

//Event Listener for toggle Censoring
export function initCensoring() {

       // Add event listener for the toggle button
    const toggleButton = document.getElementById('dict-toggle-censorship');
    if (toggleButton) {
        toggleButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the button click from bubbling up
            censoringEnabled = !censoringEnabled;
            updateDictionaryBoxes();
        });
    }
    
}
