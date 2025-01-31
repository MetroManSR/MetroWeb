export async function initAdvancedSearchPopup(allRows, rowsPerPage, currentLanguage) {
    // Load previous selections from pendingChanges
    const pendingChanges = universalPendingChanges ? universalPendingChanges : { ...defaultPendingChanges };

    // Show the popup and overlay
    advancedSearchPopup.classList.remove('hidden');
    advancedSearchOverlay.classList.add('active');
    closeAdvancedSearch.classList.remove('hidden');
    closeAdvancedSearch.classList.add('active');

    // Populate form fields with pendingChanges
    document.getElementById('dict-search-input').value = pendingChanges.searchTerm || '';
    document.getElementById('dict-search-in-word').checked = pendingChanges.searchIn.word;
    document.getElementById('dict-search-in-root').checked = pendingChanges.searchIn.root;
    document.getElementById('dict-search-in-definition').checked = pendingChanges.searchIn.definition;
    document.getElementById('dict-search-in-etymology').checked = pendingChanges.searchIn.etymology;
    document.getElementById('dict-exact-match').checked = pendingChanges.exactMatch;
    document.getElementById('dict-ignore-diacritics').checked = pendingChanges.ignoreDiacritics;
    document.getElementById('dict-starts-with').checked = pendingChanges.startsWith;
    document.getElementById('dict-ends-with').checked = pendingChanges.endsWith;

    // Populate selected filters
    const wordFilterSelect = document.getElementById('dct-wrd-flt');
    if (wordFilterSelect) {
        Array.from(wordFilterSelect.options).forEach(option => {
            option.selected = pendingChanges.filters.includes(option.value);
        });
    }

    // Close popup event listener
    closeAdvancedSearch.addEventListener('click', () => {
        advancedSearchPopup.classList.add('hidden');
        advancedSearchOverlay.classList.remove('active');
        closeAdvancedSearch.classList.add('hidden');
        closeAdvancedSearch.classList.remove('active');
    });

    // Add search event listener
    addSearchBtnPopup.addEventListener('click', async () => {
        // Update pendingChanges with form values
        pendingChanges.searchTerm = document.getElementById('dict-search-input').value.trim();
        pendingChanges.searchIn = {
            word: document.getElementById('dict-search-in-word').checked,
            root: document.getElementById('dict-search-in-root').checked,
            definition: document.getElementById('dict-search-in-definition').checked,
            etymology: document.getElementById('dict-search-in-etymology').checked
        };
        pendingChanges.exactMatch = document.getElementById('dict-exact-match').checked;
        pendingChanges.ignoreDiacritics = document.getElementById('dict-ignore-diacritics').checked;
        pendingChanges.startsWith = document.getElementById('dict-starts-with').checked;
        pendingChanges.endsWith = document.getElementById('dict-ends-with').checked;

        // Update selected filters
        if (wordFilterSelect) {
            pendingChanges.filters = Array.from(wordFilterSelect.selectedOptions).map(option => option.value);
        }

        // Update universal state and UI
        updateUniversalPendingChanges(pendingChanges);
        await updatePendingChangesList(currentLanguage);

        // Close the popup
        advancedSearchPopup.classList.add('hidden');
        advancedSearchOverlay.classList.remove('active');
        closeAdvancedSearch.classList.add('hidden');
        closeAdvancedSearch.classList.remove('active');
    });
}
