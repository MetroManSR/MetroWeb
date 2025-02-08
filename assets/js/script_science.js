// Define the password
const correctPassword = 'A1b2C3d4E5F6G7H8I9J0K1L2M3N4O5P6Q7';

// Define the initial ticket numbers
let publicTicketNumber = 1;
let specificTicketNumber = 1;

// Function to check the entered password
function checkPassword() {
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

// Define dummy data for sellers
const sellers = [
    {
        moduleNumber: "001",
        dni: "12345678",
        fullName: "John Doe",
        state: "Available",
        takenTickets: [],
        stateTime: "00:00:00",
        disconnected: false
    },
    {
        moduleNumber: "002",
        dni: "87654321",
        fullName: "Jane Smith",
        state: "Quoting",
        takenTickets: [],
        stateTime: "00:00:00",
        disconnected: false
    },
    {
        moduleNumber: "003",
        dni: "34567890",
        fullName: "Alice Johnson",
        state: "Attending",
        takenTickets: [],
        stateTime: "00:00:00",
        disconnected: false
    },
    {
        moduleNumber: "004",
        dni: "98765432",
        fullName: "Bob Brown",
        state: "Snacking",
        takenTickets: [],
        stateTime: "00:00:00",
        disconnected: false
    },
    {
        moduleNumber: "005",
        dni: "12349087",
        fullName: "Charlie White",
        state: "In Vacations",
        takenTickets: [],
        stateTime: "00:00:00",
        disconnected: false
    },
    {
        moduleNumber: "006",
        dni: "87651234",
        fullName: "Daisy Black",
        state: "Available",
        takenTickets: [],
        stateTime: "00:00:00",
        disconnected: false
    },
    {
        moduleNumber: "007",
        dni: "56789012",
        fullName: "Eve Green",
        state: "Quoting",
        takenTickets: [],
        stateTime: "00:00:00",
        disconnected: false
    },
    {
        moduleNumber: "008",
        dni: "34561278",
        fullName: "Frank Blue",
        state: "Attending",
        takenTickets: [],
        stateTime: "00:00:00",
        disconnected: false
    },
    {
        moduleNumber: "009",
        dni: "65437821",
        fullName: "Grace Red",
        state: "Available",
        takenTickets: [],
        stateTime: "00:00:00",
        disconnected: false
    },
    {
        moduleNumber: "010",
        dni: "09876543",
        fullName: "Hank Yellow",
        state: "Snacking",
        takenTickets: [],
        stateTime: "00:00:00",
        disconnected: false
    }
];

let callingInterval;
let ticketDisplayInterval;

// Function to randomly disconnect 10% of the sellers
function randomDisconnectSellers() {
    const numberOfSellers = sellers.length;
    const sellersToDisconnect = Math.floor(numberOfSellers * 0.1);
    for (let i = 0; i < sellersToDisconnect; i++) {
        const randomIndex = Math.floor(Math.random() * numberOfSellers);
        sellers[randomIndex].disconnected = true;
    }
}

// Function to display seller information
function displaySellers(sellers) {
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

// Function to simulate ticket assignment
function simulateTicket(random = true) {
    let ticketNumber;
    if (random) {
        ticketNumber = `A${publicTicketNumber++}`;
        assignRandomSeller(ticketNumber);
    } else {
        ticketNumber = `V${specificTicketNumber++}`;
        showSellerButtons(ticketNumber);
    }
                }
// Function to assign a ticket to a seller
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

// Function for sellers to take a ticket
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

// Function to show the popup
function showPopup() {
    document.getElementById('ticket-popup').style.display = 'block';
}

// Function to close the popup
function closePopup() {
    document.getElementById('ticket-popup').style.display = 'none';
    document.getElementById('seller-buttons').style.display = 'none';
}

// Function to start timers for all sellers
function startTimers() {
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

// Function to display the tickets being called
function displayTickets() {
    const ticketList = document.getElementById('ticket-list');
    ticketList.innerHTML = ''; // Clear existing tickets
    const callingSellers = sellers.filter(seller => seller.state === 'Calling');

    if (callingSellers.length === 0) return;

    let index = 0;
    ticketDisplayInterval = setInterval(() => {
        if (index >= callingSellers.length) index = 0;
        const currentSeller = callingSellers[index];
        ticketList.innerHTML = `<div class="ticket-item">
                                    <span>Módulo: ${currentSeller.moduleNumber}</span>
                                    <span>${currentSeller.takenTickets.join(", ")}</span>
                                </div>`;
        index++;
    }, 5000);
}

// Function to randomize seller states
function randomizeSellerStates() {
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

// Function to get the color based on the state
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
