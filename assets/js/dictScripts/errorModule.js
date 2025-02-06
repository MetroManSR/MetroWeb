// Array to store error messages
export const errors = [];

// Function to capture and store error messages
export function captureError(message) {
    errors.push(message);
    updateErrorButton();
}

// Function to update the error button and dropdown based on captured errors
export function updateErrorButton() {
    const errorButtonContainer = document.getElementById('error-button-container');
    const errorDropdown = document.getElementById('error-dropdown');

    if (errors.length > 0) {
        errorButtonContainer.style.display = 'block';
        errorDropdown.innerHTML = errors.map((error, index) => `
            <div>
                ${error}
                <button onclick="copyError(${index})">Copy</button>
                <button onclick="ignoreError(${index})">Ignore</button>
            </div>
        `).join('');
        errorButtonContainer.classList.add('active'); // Add active class when errors are more than 0
    } else {
        errorButtonContainer.style.display = 'none';
        errorButtonContainer.classList.remove('active'); // Remove active class when no errors
    }
}

// Function to copy error details to the clipboard
window.copyError = function(index) {
    copyToClipboard(errors[index]);
    alert('Error details copied to clipboard.');
}

// Function to ignore/delete an error and update the display
window.ignoreError = function(index) {
    errors.splice(index, 1); // Remove the error from the array
    updateErrorButton(); // Update the error button and dropdown
}

// Function to initialize the error button with click event and error listener
export function initializeErrorButton() {
    const errorButton = document.getElementById('error-button');
    const errorDropdown = document.getElementById('error-dropdown');

    errorButton.addEventListener('click', () => {
        if (errorDropdown.style.display === 'none') {
            errorDropdown.style.display = 'block';
        } else {
            errorDropdown.style.display = 'none';
        }
    });

    window.addEventListener('error', (event) => {
        captureError(event.message);
    });
}

// Global error handler to capture errors
window.onerror = function(message, source, lineno, colno, error) {
    captureError(`Error: ${message} at ${source}:${lineno}:${colno}`);

    // Return true to prevent the default browser error handling
    return true;
};
