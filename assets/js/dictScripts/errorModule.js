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
        errorDropdown.innerHTML = errors.map(error => `<div>${error}</div>`).join('');
    } else {
        errorButtonContainer.style.display = 'none';
    }
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

// Function to wait for an error event and capture the message
export function awaitError() {
    return new Promise((resolve) => {
        window.addEventListener('error', (event) => {
            captureError(event.message);
            resolve(event.message);
        });
    });
}

// Error Button Handler + Dropdown
const errorButtonHandler = () => {
    const errorBox = document.getElementById('errorBox');
    const errorMessage = `
        <div>
            <strong>Error:</strong> An unexpected issue has occurred.
        </div>
        <div>
            We're sorry for the inconvenience. Please try the following:
            <ul>
                <li>Refresh the page and try again.</li>
                <li>If the issue persists, contact support.</li>
            </ul>
            <button class="btn" id="ignoreErrorButton">Ignore Error</button>
        </div>
    `;
    errorBox.innerHTML = errorMessage;
    errorBox.classList.add('active');
    
    // Add event listener for the ignore error button
    const ignoreErrorButton = document.getElementById('ignoreErrorButton');
    ignoreErrorButton.addEventListener('click', () => {
        errorBox.classList.remove('active');
    });
};

// Function to show error when a general error occurs
const showError = () => {
    errorButtonHandler();
};
