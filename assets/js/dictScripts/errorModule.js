export const errors = [];

export function captureError(message) {
    errors.push(message);
    updateErrorButton();
}

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

export function awaitError() {
    return new Promise((resolve) => {
        window.addEventListener('error', (event) => {
            captureError(event.message);
            resolve(event.message);
        });
    });
} 
