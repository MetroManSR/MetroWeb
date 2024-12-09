/* General Styles */
body {
    font-family: Arial, sans-serif;
}

/* Header */
header {
    text-align: center;
    padding: 20px;
    background-color: #f2f2f2;
    border-bottom: 1px solid #ddd;
}

/* Search Container */
.dict-search-container {
    text-align: center;
    padding: 20px;
}

.dict-search-input,
.dict-rows-input,
.dict-filter-select {
    padding: 5px;
    margin: 5px;
    font-size: 16px;
}

/* Button Styles */
.btn {
    padding: 10px 15px;
    margin: 5px;
    font-size: 16px;
    color: #fff;
    background-color: #0078d4;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.btn:hover {
    background-color: #005a9e;
}

.btn-danger {
    background-color: #d9534f;
}

.btn-danger:hover {
    background-color: #c9302c;
}

/* Filter Dropdown */
.dict-filter-dropdown-container {
    text-align: center;
    margin: 20px 0;
}

.dict-filter-dropdown label {
    margin-right: 10px;
}

.dict-filter-select {
    padding: 5px;
    font-size: 16px;
}

/* Pagination Container */
.dict-pagination-container {
    text-align: center;
    margin: 20px 0;
}

.pagination-button {
    padding: 10px 15px;
    margin: 5px;
    font-size: 16px;
    color: #fff;
    background-color: #0078d4;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.pagination-button:hover {
    background-color: #005a9e;
}

.pagination-button.active {
    background-color: #005a9e;
}

.pagination-input {
    width: 50px;
    padding: 5px;
    font-size: 16px;
    text-align: center;
    border: 1px solid #ddd;
    border-radius: 5px;
    margin: 0 5px;
}

.pagination-display {
    font-size: 16px;
    margin-left: 5px;
}

/* Error Message */
.dict-error-message {
    text-align: center;
    padding: 20px;
    color: #d9534f;
}

/* Dictionary Box Styles */
.dictionary-box {
    border: 1px solid #0056b3; /* Dark blue border for word boxes */
    border-radius: 4px;
    padding: 10px;
    margin: 5px;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start; /* Align text to the left */
    transition: background-color 0.3s ease;
    background-color: #0056b3; /* Dark blue background for word boxes */
    color: #fff;
}

.root-word {
    border-color: #2a572a; /* Dark green border for root boxes */
    background-color: #2a572a; /* Dark green background for root boxes */
}

.no-match {
    background-color: #ffebcc; /* Yellow for no match boxes */
    border-color: #ffd699;
}

/* Type Tag and ID Display */
.type-tag {
    background-color: #cce5ff; /* Light blue for type tag */
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 0.9em;
    color: #004085;
    position: absolute;
    top: 10px;
    right: 10px;
}

.id-display {
    background-color: #d9534f; /* Red background for ID display */
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 0.9em;
    color: #fff;
    position: absolute;
    bottom: 10px;
    right: 10px;
}

.dictionary-box-title {
    font-weight: bold;
    background-color: #d6eaff; /* Lighter blue background for title */
    padding: 2px 4px;
    border-radius: 3px;
    margin-bottom: 5px;
}

.dictionary-box-meaning {
    font-size: 0.9em;
    color: #333;
    background-color: #e6f3ff; /* Light blue for meaning box */
    padding: 5px;
    border-radius: 3px;
    margin-bottom: 5px;
}

/* Selected Word and Root Styles */
.selected-word {
    border: 2px solid #0056b3; /* Wider border for selected word */
}

.selected-root {
    border: 2px solid #2a572a; /* Wider border for selected root */
}

/* General Box Fade-in Effect */
.fade-in {
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
}

/* Floating Text */
.floating-text {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 120, 212, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 14px;
}

/* Related Words Scrollable Box */
.scrollable-box {
    max-height: 100px;
    overflow-y: scroll;
    margin-top: 10px;
    padding: 5px;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 5px;
}

/* Popup Overlay and Popup */
.dict-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: none; /* Initially hidden */
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.dict-popup {
    background: #fff;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    z-index: 1001;
}

.dict-popup form {
    display: flex;
    flex-direction: column;
}

.dict-popup form input[type="checkbox"] {
    margin: 5px 0;
}

.dict-popup form button {
    margin-top: 10px;
}
