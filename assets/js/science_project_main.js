// Import all other scripts
import { checkPassword } from './scientific_project/password.js';
import { displaySellers, randomizeSellerStates, sellers } from './scientific_project/seller.js';
import { simulateTicket, showPopup, closePopup, showSellerButtons } from './scientific_project/ticket.js';
import { startTimers } from './scientific_project/timer.js';

document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners and initialize the application
    document.getElementById('password-submit').onclick = checkPassword;
    document.getElementById('close-popup').onclick = closePopup;
    document.getElementById('show-popup').onclick = showPopup;
    document.getElementById('assign-random').onclick = () => simulateTicket(true);
    document.getElementById('choose-seller').onclick = () => simulateTicket(false);

    // Initialize seller display and timers
    displaySellers(sellers);
    startTimers();
    randomizeSellerStates();
});
