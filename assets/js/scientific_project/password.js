import { randomDisconnectSellers, displaySellers, sellers } from './seller.js';
import { startTimers } from './timer.js';
import { randomizeSellerStates } from './seller.js';

const correctPassword = 'A1b2C3d4E5F6G7H8I9J0K1L2M3N4O5P6Q7';

export function checkPassword() {
    const passwordInput = document.getElementById('password-input').value;
    const errorMessage = document.getElementById('error-message');
    const passwordContainer = document.getElementById('password-container');
    const sellerContainer = document.getElementById('seller-container');

    if (passwordInput === correctPassword) {
        passwordContainer.style.display = 'none';
        sellerContainer.style.display = 'block';
        randomDisconnectSellers();
        displaySellers(sellers);
        startTimers();
        randomizeSellerStates();
    } else {
        errorMessage.style.display = 'block';
    }
}
