import { displaySellers, sellers } from './seller.js';
import { displayTickets } from './timer.js';

let callingInterval;
let publicTicketNumber = 1;
let specificTicketNumber = 1;

export function simulateTicket(random = true) {
    let ticketNumber;
    if (random) {
        ticketNumber = `A${publicTicketNumber++}`;
        assignRandomSeller(ticketNumber);
    } else {
        ticketNumber = `V${specificTicketNumber++}`;
        showSellerButtons(ticketNumber);
    }
}

function assignRandomSeller(ticketNumber) {
    const availableSellers = sellers.filter(seller => seller.state === 'Available' && !seller.disconnected);

    if (availableSellers.length === 0) {
        alert('No hay vendedores disponibles en este momento.');
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableSellers.length);
    const selectedSeller = availableSellers[randomIndex];
    assignTicketToSeller(selectedSeller, ticketNumber);
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

    document.getElementById(`module-${seller.moduleNumber}`).style.color = '#ff0000'; // Change color to red for calling

    clearInterval(callingInterval);
    callingInterval = setInterval(() => {
        const moduleElement = document.getElementById(`module-${seller.moduleNumber}`);
        if (moduleElement.style.color === 'rgb(255, 0, 0)') {
            moduleElement.style.color = '#ffcccc'; // Lighter red
        } else {
            moduleElement.style.color = '#ff0000'; // Red
        }
    }, 500);

    alert(`Ticket ${ticketNumber} asignado a ${seller.fullName}.`);

    setTimeout(() => {
        takeTicket(seller.moduleNumber, ticketNumber);
    }, Math.floor(Math.random() * 3000) + 2000); // Random delay between 2 and 5 seconds

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
            clearInterval(callingInterval);
        }
        seller.stateStartTime = new Date();  // Reset the state start time

        displaySellers(sellers);
        displayTickets();
    } else {
        alert('Número de módulo inválido.');
    }
}

export function showPopup() {
    document.getElementById('ticket-popup').style.display = 'block';
}

export function closePopup() {
    document.getElementById('ticket-popup').style.display = 'none';
    document.getElementById('seller-buttons').style.display = 'none';
}
