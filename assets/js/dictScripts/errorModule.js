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
        errorDropdown.innerHTML = errors.map(error => `
            <div>${error}</div>
        `).join('');
        errorButtonContainer.classList.add('active'); // Add active class when errors are more than 0
    } else {
        errorButtonContainer.style.display = 'none';
        errorButtonContainer.classList.remove('active'); // Remove active class when no errors
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

// Global error handler to display errors on screen
window.onerror = function(message, source, lineno, colno, error) {
    captureError(`Error: ${message} at ${source}:${lineno}:${colno}`);
    const errorBox = document.createElement('div');
    errorBox.style.position = 'fixed';
    errorBox.style.top = '10px';
    errorBox.style.right = '10px';
    errorBox.style.width = '300px';
    errorBox.style.padding = '10px';
    errorBox.style.backgroundColor = 'red';
    errorBox.style.color = 'white';
    errorBox.style.zIndex = '1000';
    errorBox.style.borderRadius = '5px';
    errorBox.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';

    errorBox.innerHTML = `
        <strong>Error:</strong> ${message}<br>
        <strong>Source:</strong> ${source}<br>
        <strong>Line:</strong> ${lineno}, Column: ${colno}
    `;

    document.body.appendChild(errorBox);

    // Return true to prevent the default browser error handling
    return true;
};
