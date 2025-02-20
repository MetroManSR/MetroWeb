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
            revision: "NR",
        };

        if (type === 'word') {
            cleanedRow.title = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col1 ? row.col1.trim() : '') : row.col1 ? row.col1.trim() : ''); // Title for words
            cleanedRow.partofspeech = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col2 ? row.col2.trim() : '') : row.col2 ? row.col2.trim() : ''); // Part of Speech for words
            cleanedRow.meta = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col3 ? row.col3.trim() : '') : row.col3 ? row.col3.trim() : ''); // Meta for words
            cleanedRow.notes = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col4 ? row.col4.trim() : '') : row.col4 ? row.col4.trim() : ''); // Notes for words
            cleanedRow.revision = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col6 ? row.col6.trim() : '') : row.col6 ? row.col6.trim() : ''); // Revision for words

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
            cleanedRow.revision = sanitizeHTML(idsNeedingFixing.includes(index) ? fixEncoding(row.col4 ? row.col4.trim() : '') : row.col4 ? row.col4.trim() : ''); // Notes for words

            const notesAndEtymology = row.col3 ? row.col3.trim() : '';
            if (notesAndEtymology.includes('|')) {
                const parts = notesAndEtymology.split('|');
                cleanedRow.notes = sanitizeHTML(parts[0].trim());
                cleanedRow.morph = await parseMorph(parts[1], row);
            } else {
                if (!notesAndEtymology.startsWith("et") && !notesAndEtymology.startsWith("del")) {
                    cleanedRow.notes = sanitizeHTML(notesAndEtymology);
                    cleanedRow.morph = [];
                } else {
                    cleanedRow.notes = '';
                    cleanedRow.morph = await parseMorph(notesAndEtymology, row);
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

        // Format the meta field
        cleanedRow.meta = await formatMeta(cleanedRow.meta);

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

    return cleanedData;
}
/**
 * Parses the morph field to create a dictionary if it meets specific conditions.
 * @param {string} morphText - The morph field to be parsed.
 * @param {Object} row - The current row being processed.
 * @returns {Promise<Object|Array>} - A promise that resolves to the parsed morph dictionary or the original morph array.
 */
async function parseMorph(morphText, row) {
    try {
        //console.log('Processing row:', row);

        // Check if the row version is '25V2' and contains ':'
        if (row.col4 && row.col4.trim() === '25V2') {
            //console.log('Processing morph for row:', row.col2, 'Version:', row.col4);

            let morphData = morphText.split(',').map(item => item.trim());
            //console.log('Initial morph data:', morphData);

            if (!Array.isArray(morphData)) {
                morphData = [morphData];
            }
            //console.log('Normalized morph data:', morphData);

            const morphDict = {
                originLanguages: [],
                originWords  : [],
                originRomanizations: [],
            };

            morphData.forEach(item => {
                try {
                    console.log('Processing item:', item);

                    // Universal regex patterns
                    const matchOriginLanguage = /^et (.+?)(?=:|$)/.test(item);  // Match any character until : or end of string
                    const matchOriginWord = /: (.+?)(?= \[|$)/.test(item);  // Match any character until [ or end of string
                    const matchRomanization = /\[([^\]]+)\]/.test(item);  // Match any character until ]

                    if (matchOriginLanguage || matchOriginWord || matchRomanization) {
                        //console.log('Matches found - Origin Language:', matchOriginLanguage, 'Origin Word:', matchOriginWord, 'Romanization:', matchRomanization);

                        if (matchOriginLanguage) {
                            const originLanguageMatch = item.match(/^et (.+?)(?=:|$)/);
                            if (originLanguageMatch && originLanguageMatch[1]) {
                                morphDict.originLanguages.push(originLanguageMatch[1].trim());
                            } else {
                                morphDict.originLanguages.push(''); // Add empty string for consistency
                            }
                        }

                        if (matchOriginWord) {
                            const originWordMatch = item.match(/: (.+?)(?= \[|$)/);
                            if (originWordMatch && originWordMatch[1]) {
                                morphDict.originWords.push(originWordMatch[1].trim());
                            } else{
                                // If no romanization, assume the word is the whole remaining part after ":"
                                const fallbackOriginWordMatch = item.match(/: (.+?)(?=|$)/);
                                morphDict.originWords.push(fallbackOriginWordMatch ? fallbackOriginWordMatch[1].trim() : '');
                            }
                        } else {
                            morphDict.originWords.push(''); // Add empty string for consistency
                        }

                        if (matchRomanization) {
                            const romanizationMatch = item.match(/\[([^\]]+)\]/);
                            if (romanizationMatch && romanizationMatch[1]) {
                                morphDict.originRomanizations.push(romanizationMatch[1].replace(/[\[\]]/g, '').trim()); // Remove [] and trim
                            } else {
                                morphDict.originRomanizations.push(''); // Add empty string for consistency
                            }
                        } else {
                            morphDict.originRomanizations.push(''); // Add empty string for consistency
                        }
                    } else if (item.toLowerCase().includes('balkeon original')) {
                        // Handle "Balkeon Original" case
                        morphDict.originLanguages.push('Balkeon');
                        morphDict.originWords.push('Original');
                        morphDict.originRomanizations.push('');
                    } else {
                        //console.log('No matches found for item:', item);
                        // If it doesn't match the special format, keep it as is
                        morphDict.originLanguages.push(item);
                        morphDict.originWords.push(item);
                        morphDict.originRomanizations.push('');
                    }
                } catch (error) {
                    console.error('Error processing item:', item, error);
                }
            });

            //console.log('Final morph dict:', JSON.stringify(morphDict, null, 2));

            return morphDict.originLanguages.length > 0 || morphDict.originWords.length > 0 || morphDict.originRomanizations.length > 0
                ? morphDict
                : morphData;
        } else {
            console.log('Using old processing for row:', row.col2, 'Version:', row.col4);
            // Old processing
            return morphText.split(',').map(item => item.trim());
        }
    } catch (error) {
        console.error('Error processing row:', row, error);
        return morphText.split(',').map(item => item.trim()); // Fallback to old processing in case of error
    }
} 

/**
 * Formats the meta field to handle special formatting requirements.
 * @param {string} meta - The meta field to be formatted.
 * @returns {Promise<string>} - A promise that resolves to the formatted meta field.
 */
async function formatMeta(meta) {
    const matches = meta.match(/et ([\w\s]+?):?\s?([\w\s]+?)(?: \[([\w\s]+)\])?(?:,|$)/);
    if (!matches) return meta;

    const [, originalLanguage, originalWord, romanizedScript] = matches;

    let formattedMeta = `${originalLanguage.trim()}: ${originalWord.trim()}`;
    if (romanizedScript) {
        formattedMeta += ` <sup style="color: gray;">${romanizedScript.replace(/[\[\]]/g, '').trim()}</sup>`;
    }

    return formattedMeta;
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
