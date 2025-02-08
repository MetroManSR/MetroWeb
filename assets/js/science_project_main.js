// Import all other scripts
import { checkPassword } from './scientific_project/password.js';
import { displaySellers, randomizeSellerStates, sellers } from './scientific_project/seller.js';
import { simulateTicket, showPopup, closePopup } from './scientific_project/ticket.js';
import { startTimers } from './scientific_project/timer.js';

document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners and initialize the application
    document.getElementById('password-container').querySelector('button').onclick = checkPassword;
    document.getElementById('ticket-popup').querySelector('.close').onclick = closePopup;
    document.querySelector('button[onclick="showPopup()"]').onclick = showPopup;

    // Initialize seller display and timers
    displaySellers(sellers);
    startTimers();
    randomizeSellerStates();
});
