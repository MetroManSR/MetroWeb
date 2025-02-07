import { copyToClipboard } from './utils.js';

// Array to store error messages
export const errors = [];

// Function to capture and store error messages
export async function captureError(message) {
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
            <div id="error-${index}">
                ${error}
                <button class="copy-btn" data-index="${index}">Copy</button>
                <button class="ignore-btn" data-index="${index}">Ignore</button>
            </div>
        `).join('');
        errorButtonContainer.classList.add('active'); // Add active class when errors are more than 0
        
        // Add event listeners to the buttons after they are rendered
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', event => {
                const index = event.target.dataset.index;
                copyError(index);
            });
        });

        document.querySelectorAll('.ignore-btn').forEach(btn => {
            btn.addEventListener('click', event => {
                const index = event.target.dataset.index;
                ignoreError(index);
            });
        });
    } else {
        errorButtonContainer.style.display = 'none';
        errorButtonContainer.classList.remove('active'); // Remove active class when no errors
    }
}

// Function to copy error details to the clipboard
function copyError(index) {
    copyToClipboard(errors[index]);
    alert('Error details copied to clipboard.');
}

// Function to ignore/delete an error and update the display
function ignoreError(index) {
    errors.splice(index, 1); // Remove the error from the array
    updateErrorButton(); // Update the error button and dropdown
}

// Function to initialize the error button with click event and error listener
export function initializeErrorButton() {
    const errorButton = document.getElementById('error-button');
    const errorDropdown = document.getElementById('error-dropdown');

    errorButton.addEventListener('click', () => {
        if (errorDropdown.style.display === 'none' || errorDropdown.style.display === '') {
            errorDropdown.style.display = 'block';
        } else {
            errorDropdown.style.display = 'none';
        }
    });

    // Ensure that the event listener is registered
    window.addEventListener('error', (event) => {
        console.log('Error captured:', event.message);
        captureError(event.message);
    });
}

// Global error handler to capture errors
window.onerror = function(message, source, lineno, colno, error) {
    console.log(`Global error handler: Error: ${message} at ${source}:${lineno}:${colno}`);
    captureError(`Error: ${message} at ${source}:${lineno}:${colno}`);

    // Return true to prevent the default browser error handling
    return true;
}; 
