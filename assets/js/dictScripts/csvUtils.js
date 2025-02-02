import { createHyperlink } from './utils.js';

/**
 * Cleans and formats the data for the dictionary.
 * @param {Array} data - The raw data to be cleaned.
 * @param {string} type - The type of data (e.g., 'word', 'root').
 * @param {Array} allRows - The array of all dictionary rows.
 * @returns {Promise<Array>} - A promise that resolves to the cleaned and formatted data.
 */
export async function cleanData(data, type, allRows) {
    const totalRows = data.length;

    // Progress bar elements
    const progressBar = document.getElementById('dict-progress-bar');
    const progressText = document.getElementById('dict-progress-text');

    if (!progressBar || !progressText) {
        console.error("Progress bar or text element not found!");
        return [];
    }

    const cleanedData = [];
    const anomalies = [];
    const increment = Math.ceil(totalRows / 10); // Calculate increment for 10% steps

    // List of IDs needing character fixing
    const idsNeedingFixing = data
        .map((row, index) => ({
            id: index,
            needsFixing: /Ã|Â/.test(row.col1 || '') || /Ã|Â/.test(row.col2 || '') || /Ã|Â/.test(row.col3 || '') || /Ã|Â/.test(row.col4 || '') || /Ã|Â/.test(row.col5 || '')
        }))
        .filter(row => row.needsFixing)
        .map(row => row.id);

    for (let index = 0; index < totalRows; index++) {
        const row = data[index];

        let cleanedRow = {
            id: index, // Assign unique ID
            type: type, // Identification of type (root or word)
            title: '', // Initialize title
            partofspeech: '', // Initialize part of speech for words
            meta: '', // Initialize meta
            notes: '', // Initialize notes
            morph: [], // Initialize morph as an array
            revision: "VU",
        };

        if (type === 'word') {
            cleanedRow.title = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col1 ? row.col1.trim() : '') : row.col1 ? row.col1.trim() : ''); // Title for words
            cleanedRow.partofspeech = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col2 ? row.col2.trim() : '') : row.col2 ? row.col2.trim() : ''); // Part of Speech for words
            cleanedRow.meta = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col3 ? row.col3.trim() : '') : row.col3 ? row.col3.trim() : ''); // Meta for words
            cleanedRow.notes = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col4 ? row.col4.trim() : '') : row.col4 ? row.col4.trim() : ''); // Notes for words
            cleanedRow.revision = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col5 ? row.col6.trim() : '') : row.col6 ? row.col6.trim() : ''); // Notes for words

            let morphData = row.col5 ? row.col5.trim().split(',').map(item => item.trim()) : [];

            // Process morphData asynchronously to create hyperlinks
            const createHyperlinksAsync = async () => {
                cleanedRow.morph = await Promise.all(morphData.map(async (item) => {
                    return await createHyperlink(item, '', allRows);
                }));
            };

            // Invoke the function to create hyperlinks
            await createHyperlinksAsync();

        } else if (type === 'root') {
            cleanedRow.title = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col1 ? row.col1.trim() : '') : row.col1 ? row.col1.trim() : ''); // Word title for roots
            cleanedRow.meta = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col2 ? row.col2.trim() : '') : row.col2 ? row.col2.trim() : ''); // Meta for roots
            cleanedRow.revision = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col3 ? row.col4.trim() : '') : row.col4 ? row.col4.trim() : ''); // Notes for words

            const notesAndEtimology = row.col3 ? row.col3.trim() : '';
            if (notesAndEtimology.includes('|')) {
                const parts = notesAndEtimology.split('|');
                cleanedRow.notes = sanitizeHTML(parts[0].trim());
                cleanedRow.morph = parts[1] ? parts[1].split(',').map(item => sanitizeHTML(item.trim())) : [];
            } else {
                if (!notesAndEtimology.startsWith("et") && !notesAndEtimology.startsWith("del")) {
                    cleanedRow.notes = sanitizeHTML(notesAndEtimology);
                    cleanedRow.morph = [];
                } else {
                    cleanedRow.notes = '';
                    cleanedRow.morph = notesAndEtimology.split(',').map(item => sanitizeHTML(item.trim()));
                }
            }

            // Ensure morph is always an array
            if (!Array.isArray(cleanedRow.morph)) {
                cleanedRow.morph = [cleanedRow.morph];
            }
        }

        // Check for anomalies (missing title or meta)
        if (!cleanedRow.title || !cleanedRow.meta) {
            anomalies.push({ id: cleanedRow.id, title: cleanedRow.title, meta: cleanedRow.meta });
            continue; // Skip adding the row if it's invalid
        }

        cleanedData.push(cleanedRow);

        // Update real progress bar in whole percentage increments
        if ((index + 1) % increment === 0 || index === totalRows - 1) { // Update at each 10% step and at the end
            const progress = Math.min(Math.floor(((index + 1) / totalRows) * 100), 100); // Limit progress to 100%
            progressBar.style.width = `${progress}%`;
            progressBar.style.display = 'block'; // Ensure the progress bar is visible
            progressText.textContent = `Parsed ${progress}%`;

            // Force reflow to update the progress bar
            progressBar.offsetWidth; // Trigger a reflow

            // Yield control to render the progress bar
            await new Promise(resolve => setTimeout(resolve, 1)); // Add a delay to ensure progress bar update
        }
    }

    // Ensure progress bar completes at 100%
    progressBar.style.width = `100%`;
    progressText.textContent = `Parsing complete!`;

  /* 
    // After 3 seconds, display anomalies if any
    setTimeout(() => {
        if (anomalies.length > 0) {
            progressText.textContent = `${anomalies.length} anomalies found: ${anomalies.map(anomaly => anomaly.title ? `Title: "${anomaly.title}"` : `Meta: "${anomaly.meta}"`).join(', ')}`;
        } else {
            progressText.textContent = `No anomalies found!`;
        }
    }, 3000);*/

    //console.log("Cleaned Data:", cleanedData);

    return cleanedData;
}

/**
 * Sanitizes a string to remove any potentially harmful HTML content.
 * @param {string} str - The string to be sanitized.
 * @returns {string} - The sanitized string.
 */
export function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Fixes encoding issues for specific cases.
 * @param {string} str - The string to be fixed.
 * @returns {string} - The fixed string.
 */
export function fixEncoding(str) {
    return str.replace(/Ã¡/g, 'á')
              .replace(/Ã©/g, 'é')
              .replace(/Ã­/g, 'í')
              .replace(/Ã³/g, 'ó')
              .replace(/Ãº/g, 'ú')
              .replace(/Ã/g, 'Á')
              .replace(/Ã‰/g, 'É')
              .replace(/Ã/g, 'Í')
              .replace(/Ã“/g, 'Ó')
              .replace(/Ãš/g, 'Ú')
              .replace(/Ã±/g, 'ñ')
              .replace(/Ã‘/g, 'Ñ')
              .replace(/Â¿/g, '¿')
              .replace(/Â¡/g, '¡');
}
