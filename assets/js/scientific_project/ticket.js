import { displaySellers, sellers } from './sellers.js';

let publicTicketNumber = 1;
let specificTicketNumber = 1;
const ticketQueue = [];

export function simulateTicket(random = true) {
    let ticketNumber;
    if (random) {
        ticketNumber = `A${publicTicketNumber++}`;
        assignPublicTicket(ticketNumber);
    } else {
        ticketNumber = `V${specificTicketNumber++}`;
        showSellerButtons(ticketNumber);
    }
}

function assignPublicTicket(ticketNumber) {
    const availableSellers = sellers.filter(seller => seller.state === 'Available' && !seller.disconnected);

    if (availableSellers.length === 0) {
        // Add to queue if no sellers are available
        ticketQueue.push(ticketNumber);
        displayUnattendedTickets();
    } else {
        const randomIndex = Math.floor(Math.random() * availableSellers.length);
        const selectedSeller = availableSellers[randomIndex];
        assignTicketToSeller(selectedSeller, ticketNumber);
    }
}

export function showSellerButtons(ticketNumber) {
    const sellerButtons = document.getElementById('seller-buttons');
    sellerButtons.innerHTML = ''; // Clear existing buttons
    const eligibleSellers = sellers.filter(seller => seller.state !== 'In Vacations' && !seller.disconnected);

    eligibleSellers.forEach(seller => {
        const button = document.createElement('button');
        button.textContent = `Módulo: ${seller.moduleNumber} - ${seller.fullName}`;
        button.onclick = () => {
            if (seller.state === 'Quoting' && !confirm(`El vendedor ${seller.fullName} está cotizando. ¿Desea asignar el ticket de todas maneras?`)) {
                return;
            }
            assignTicketToSeller(seller, ticketNumber);
        };
        sellerButtons.appendChild(button);
    });

    sellerButtons.style.display = 'block';
}

function assignTicketToSeller(seller, ticketNumber) {
    if (seller.takenTickets.length === 0) {
        seller.takenTickets.push(ticketNumber);
        seller.state = 'Calling';
        seller.stateTime = '00:00:00';
        seller.stateStartTime = new Date();  // Save the state start time

        const moduleElement = document.getElementById(`module-${seller.moduleNumber}`);
        moduleElement.style.color = '#ff0000'; // Change color to red for calling
        moduleElement.style.fontWeight = 'bold';
        moduleElement.innerHTML = `Módulo: ${seller.moduleNumber}, ${ticketNumber}`;

        const flashInterval = setInterval(() => {
            moduleElement.style.color = moduleElement.style.color === 'rgb(255, 0, 0)' ? '#ffcccc' : '#ff0000'; // Toggle between red and lighter red
        }, 500);

        closePopup();

        // Wait 1 to 3 seconds before transitioning to Attending state
        setTimeout(() => {
            seller.state = 'Attending';
            moduleElement.style.color = '#f1c40f'; // Yellow for attending
            clearInterval(flashInterval);

            setTimeout(() => {
                randomizeSellerState(seller);
            }, Math.floor(Math.random() * 5000) + 30000); // Random delay between 30 and 35 seconds

            // Handle ticket queue
            if (ticketQueue.length > 0) {
                const nextTicket = ticketQueue.shift();
                assignPublicTicket(nextTicket);
            }
        }, Math.floor(Math.random() * 2000) + 1000); // Random delay between 1 and 3 seconds

        displaySellers(sellers);
        displayTickets();
    }
}

function randomizeSellerState(seller) {
    const states = ['Available', 'Quoting', 'Snacking'];
    const randomState = states[Math.floor(Math.random() * states.length)];
    seller.state = randomState;
    seller.stateTime = '00:00:00';  // Reset the state timer
    seller.stateStartTime = new Date();  // Save the state start time
    document.getElementById(`module-${seller.moduleNumber}`).style.color = getStateColor(randomState);

    if (randomState === 'Quoting' || randomState === 'Snacking') {
        // Wait 30 to 35 seconds before transitioning to another random state
        setTimeout(() => {
            randomizeSellerState(seller);
        }, Math.floor(Math.random() * 5000) + 30000); // Random delay between 30 and 35 seconds
    }

    displaySellers(sellers);
    displayTickets();
}

function getStateColor(state) {
    switch (state) {
        case 'Available':
            return '#007bff'; // Blue
        case 'Quoting':
            return '#ff0000'; // Red
        case 'Snacking':
            return '#ff0000'; // Red
        case 'In Vacations':
            return '#d4ac0d'; // Yellow
        default:
            return '#000000'; // Default black
    }
}

function displayUnattendedTickets() {
    const unattendedList = document.getElementById('unattended-tickets');
    unattendedList.innerHTML = ''; // Clear existing unattended tickets

    ticketQueue.forEach(ticketNumber => {
        const ticketItem = document.createElement('div');
        ticketItem.classList.add('ticket-item');
        ticketItem.innerHTML = `
            <span>${ticketNumber}</span>
            <button onclick="removeTicket('${ticketNumber}')">Anular</button>
        `;
        unattendedList.appendChild(ticketItem);
    });
}

function removeTicket(ticketNumber) {
    const index = ticketQueue.indexOf(ticketNumber);
    if (index > -1) {
        ticketQueue.splice(index, 1);
    }
    displayUnattendedTickets();
}

export function displayTickets() {
    const ticketList = document.getElementById('ticket-list');
    ticketList.innerHTML = ''; // Clear existing tickets

    let index = 0;
    if (ticketQueue.length > 0) {
        const ticketNumber = ticketQueue[index];
        ticketList.innerHTML = `<div class="ticket-item">
                                    <span>${ticketNumber}</span>
                                </div>`;
        index++;
    }

    const callingSellers = sellers.filter(seller => seller.state === 'Calling');
    if (callingSellers.length === 0) return;

    let callingIndex = 0;
    setInterval(() => {
        if (callingIndex >= callingSellers.length) callingIndex = 0;
        const currentSeller = callingSellers[callingIndex];
        ticketList.innerHTML = `<div class="ticket-item">
                                    <span>Módulo: ${currentSeller.moduleNumber}</span>
                                    <span>${currentSeller.takenTickets.join(", ")}</span>
                                </div>`;
        callingIndex++;
    }, 3000); // Wait 3 seconds for each calling ticket
}

export function showPopup() {
    document.getElementById('ticket-popup').style.display = 'block';
}

export function closePopup() {
    document.getElementById('ticket-popup').style.display = 'none';
    document.getElementById('seller-buttons').style.display = 'none';
} 
