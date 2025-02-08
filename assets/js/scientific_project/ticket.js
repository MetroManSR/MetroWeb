import { displaySellers, sellers } from './sellers.js';

let callingInterval;
let publicTicketNumber = 1;
let specificTicketNumber = 1;
const ticketQueue = [];

export function simulateTicket(random = true) {
    let ticketNumber;
    if (random) {
        ticketNumber = `A${publicTicketNumber++}`;
        assignTicket(ticketNumber);
    } else {
        ticketNumber = `V${specificTicketNumber++}`;
        showSellerButtons(ticketNumber);
    }
}

function assignTicket(ticketNumber) {
    const availableSellers = sellers.filter(seller => seller.state === 'Available' && !seller.disconnected);

    if (availableSellers.length === 0) {
        // Add to queue if no sellers are available
        ticketQueue.push(ticketNumber);
    } else {
        const randomIndex = Math.floor(Math.random() * availableSellers.length);
        const selectedSeller = availableSellers[randomIndex];
        assignTicketToSeller(selectedSeller, ticketNumber);
    }
}

export function showSellerButtons(ticketNumber) {
    const sellerButtons = document.getElementById('seller-buttons');
    sellerButtons.innerHTML = ''; // Clear existing buttons
    const availableSellers = sellers.filter(seller => seller.state === 'Available' && !seller.disconnected);

    availableSellers.forEach(seller => {
        const button = document.createElement('button');
        button.textContent = `Módulo: ${seller.moduleNumber} - ${seller.fullName}`;
        button.onclick = () => assignTicketToSeller(seller, ticketNumber);
        sellerButtons.appendChild(button);
    });

    sellerButtons.style.display = 'block';
}

function assignTicketToSeller(seller, ticketNumber) {
    seller.takenTickets.push(ticketNumber);
    seller.state = 'Calling';
    seller.stateTime = '00:00:00';
    seller.stateStartTime = new Date();  // Save the state start time

    const moduleElement = document.getElementById(`module-${seller.moduleNumber}`);
    moduleElement.style.color = '#ff0000'; // Change color to red for calling
    moduleElement.style.fontWeight = 'bold';
    moduleElement.innerHTML = `Módulo: ${seller.moduleNumber}, ${ticketNumber}`;

    clearInterval(callingInterval);
    callingInterval = setInterval(() => {
        if (moduleElement.style.color === 'rgb(255, 0, 0)') {
            moduleElement.style.color = '#ffcccc'; // Lighter red
        } else {
            moduleElement.style.color = '#ff0000'; // Red
        }
    }, 500);

    closePopup();

    setTimeout(() => {
        takeTicket(seller.moduleNumber, ticketNumber);
    }, Math.floor(Math.random() * 5000) + 30000); // Random delay between 30 and 35 seconds

    displaySellers(sellers);
    displayTickets();
}

function takeTicket(moduleNumber, ticketNumber) {
    const seller = sellers.find(s => s.moduleNumber === moduleNumber);
    if (seller) {
        seller.takenTickets = seller.takenTickets.filter(ticket => ticket !== ticketNumber);
        if (seller.takenTickets.length === 0) {
            seller.state = 'Attending';
            document.getElementById(`module-${seller.moduleNumber}`).style.color = '#f1c40f'; // Yellow for attending
            document.getElementById(`module-${seller.moduleNumber}`).style.fontWeight = 'normal';
            document.getElementById(`module-${seller.moduleNumber}`).innerHTML = `Módulo: ${seller.moduleNumber}`;

            // Handle ticket queue
            if (ticketQueue.length > 0) {
                const nextTicket = ticketQueue.shift();
                assignTicket(nextTicket);
            } else {
                seller.state = 'Available';
            }

            clearInterval(callingInterval);
        }
        seller.stateStartTime = new Date();  // Reset the state start time

        displaySellers(sellers);
        displayTickets();
    }
}

export function displayTickets() {
    const ticketList = document.getElementById('ticket-list');
    ticketList.innerHTML = ''; // Clear existing tickets
    const callingSellers = sellers.filter(seller => seller.state === 'Calling');

    if (callingSellers.length === 0) return;

    let index = 0;
    setInterval(() => {
        if (index >= callingSellers.length) index = 0;
        const currentSeller = callingSellers[index];
        ticketList.innerHTML = `<div class="ticket-item">
                                    <span>Módulo: ${currentSeller.moduleNumber}</span>
                                    <span>${currentSeller.takenTickets.join(", ")}</span>
                                </div>`;
        index++;
    }, 5000);
}

export function showPopup() {
    document.getElementById('ticket-popup').style.display = 'block';
}

export function closePopup() {
    document.getElementById('ticket-popup').style.display = 'none';
    document.getElementById('seller-buttons').style.display = 'none';
}
