import { sellers } from './sellers.js';
import { displayTickets } from './ticket.js';

export function startTimers() {
    setInterval(() => {
        sellers.forEach(seller => {
            if (seller.stateStartTime) {
                const now = new Date();
                const timeDiff = Math.floor((now - seller.stateStartTime) / 1000);
                const hours = String(Math.floor(timeDiff / 3600)).padStart(2, '0');
                const minutes = String(Math.floor((timeDiff % 3600) / 60)).padStart(2, '0');
                const seconds = String(timeDiff % 60).padStart(2, '0');
                document.getElementById(`state-time-${seller.moduleNumber}`).textContent = `${hours}:${minutes}:${seconds}`;
            }
        });
    }, 1000);
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
