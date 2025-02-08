export const sellers = [
    { moduleNumber: "001", dni: "12345678", fullName: "John Doe", state: "Available", takenTickets: [], stateTime: "00:00:00", disconnected: false },
    { moduleNumber: "002", dni: "87654321", fullName: "Jane Smith", state: "Quoting", takenTickets: [], stateTime: "00:00:00", disconnected: false },
    { moduleNumber: "003", dni: "34567890", fullName: "Alice Johnson", state: "Attending", takenTickets: [], stateTime: "00:00:00", disconnected: false },
    { moduleNumber: "004", dni: "98765432", fullName: "Bob Brown", state: "Snacking", takenTickets: [], stateTime: "00:00:00", disconnected: false },
    { moduleNumber: "005", dni: "12349087", fullName: "Charlie White", state: "In Vacations", takenTickets: [], stateTime: "00:00:00", disconnected: false },
    { moduleNumber: "006", dni: "87651234", fullName: "Daisy Black", state: "Available", takenTickets: [], stateTime: "00:00:00", disconnected: false },
    { moduleNumber: "007", dni: "56789012", fullName: "Eve Green", state: "Quoting", takenTickets: [], stateTime: "00:00:00", disconnected: false },
    { moduleNumber: "008", dni: "34561278", fullName: "Frank Blue", state: "Attending", takenTickets: [], stateTime: "00:00:00", disconnected: false },
    { moduleNumber: "009", dni: "65437821", fullName: "Grace Red", state: "Available", takenTickets: [], stateTime: "00:00:00", disconnected: false },
    { moduleNumber: "010", dni: "09876543", fullName: "Hank Yellow", state: "Snacking", takenTickets: [], stateTime: "00:00:00", disconnected: false }
];

export function randomDisconnectSellers() {
    const numberOfSellers = sellers.length;
    const sellersToDisconnect = Math.floor(numberOfSellers * 0.1);
    for (let i = 0; i < sellersToDisconnect; i++) {
        const randomIndex = Math.floor(Math.random() * numberOfSellers);
        sellers[randomIndex].disconnected = true;
    }
}

export function displaySellers(sellers) {
    const sellerList = document.getElementById('seller-list');
    sellerList.innerHTML = ''; // Clear existing content
    for (let i = 1; i <= 16; i++) {
        const seller = sellers.find(s => s.moduleNumber === i.toString().padStart(3, '0'));
        const sellerDiv = document.createElement('div');
        sellerDiv.classList.add('seller');
        if (seller) {
            sellerDiv.innerHTML = `
                <h2 id="module-${seller.moduleNumber}">Módulo: ${seller.moduleNumber}</h2>
                <p>DNI: ${seller.dni}</p>
                <p>Nombre: ${seller.fullName}</p>
                <p>Estado: ${seller.disconnected ? "Desconectado" : seller.state}</p>
                <p>Tickets: ${seller.takenTickets.length > 0 ? seller.takenTickets.join(", ") : "Ninguno"}</p>
                <p>Tiempo en Estado: <span id="state-time-${seller.moduleNumber}">${seller.stateTime}</span></p>
            `;
        } else {
            sellerDiv.innerHTML = `
                <h2>Módulo: ${i.toString().padStart(3, '0')}</h2>
                <p>DNI: No Ocupado</p>
                <p>Nombre: No Ocupado</p>
                <p>Estado: No Ocupado</p>
                <p>Tickets: No Ocupado</p>
                <p>Tiempo en Estado: No Ocupado</p>
            `;
        }
        sellerList.appendChild(sellerDiv);
    }
}

export function randomizeSellerStates() {
    setInterval(() => {
        sellers.forEach(seller => {
            if (seller.state !== 'Attending' && seller.state !== 'Calling' && !seller.disconnected) {
                const states = ['Available', 'Quoting', 'Snacking'];
                const randomState = states[Math.floor(Math.random() * states.length)];
                seller.state = randomState;
                document.getElementById(`module-${seller.moduleNumber}`).style.color = getStateColor(randomState);
            }
        });
        displaySellers(sellers);
    }, Math.floor(Math.random() * 5000) + 10000); // Randomize between 10 and 15 seconds
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
