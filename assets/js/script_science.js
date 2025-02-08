// Define the password
const correctPassword = 'A1b2C3d4E5F6G7H8I9J0K1L2M3N4O5P6Q7';

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
                <h2 id="module-${seller.moduleNumber}">Module: ${seller.moduleNumber}</h2>
                <p>DNI: ${seller.dni}</p>
                <p>Name: ${seller.fullName}</p>
                <p>State: ${seller.disconnected ? "Disconnected" : seller.state}</p>
                <p>Tickets: ${seller.takenTickets.length > 0 ? seller.takenTickets.join(", ") : "None"}</p>
                <p>State Time: <span id="state-time-${seller.moduleNumber}">${seller.stateTime}</span></p>
            `;
        } else {
            sellerDiv.innerHTML = `
                <h2>Module: ${i.toString().padStart(3, '0')}</h2>
                <p>DNI: Unoccupied</p>
                <p>Name: Unoccupied</p>
                <p>State: Unoccupied</p>
                <p>Tickets: Unoccupied</p>
                <p>State Time: Unoccupied</p>
            `;
        }
        sellerList.appendChild(sellerDiv);
    }
}

// Function to simulate ticket assignment
function simulateTicket(random = true) {
    let selectedSeller;
    const availableSellers = sellers.filter(seller => seller.state === 'Available' && !seller.disconnected);

    if (availableSellers.length === 0) {
        alert('No available sellers at the moment.');
        return;
    }

    const ticketNumber = prompt('Enter the ticket number:');

    if (random) {
        const randomIndex = Math.floor(Math.random() * availableSellers.length);
        selectedSeller = availableSellers[randomIndex];
    } else {
        const sellerOptions = availableSellers.map(seller => `${seller.moduleNumber}: ${seller.fullName}`).join('\n');
        const chosenModule = prompt(`Available Sellers:\n${sellerOptions}\nEnter the module number of the chosen seller:`);
        selectedSeller = availableSellers.find(seller => seller.moduleNumber === chosenModule);
        if (!selectedSeller) {
            alert('Invalid module number.');
            return;
        }
    }

    selectedSeller.takenTickets.push(ticketNumber);
    selectedSeller.state = 'Calling';
    selectedSeller.stateTime = '00:00:00';
    selectedSeller.stateStartTime = new Date();  // Save the state start time

    document.getElementById(`module-${selectedSeller.moduleNumber}`).style.color = '#ff0000'; // Change color to red for calling

    clearInterval(callingInterval);
    callingInterval = setInterval(() => {
        const moduleElement = document.getElementById(`module-${selectedSeller.moduleNumber}`);
        if (moduleElement.style.color === 'rgb(255, 0, 0)') {
            moduleElement.style.color = '#ffcccc'; // Lighter red
        } else {
            moduleElement.style.color = '#ff0000'; // Red
        }
    }, 500);

    alert(`Ticket ${ticketNumber} assigned to ${selectedSeller.fullName}.`);

    setTimeout(() => {
        takeTicket(selectedSeller.moduleNumber, ticketNumber);
    }, Math.floor(Math.random() * 3000) + 2000); // Random delay between 2 and 5 seconds

    displaySellers(sellers);
}

// Function for sellers to take a ticket
function takeTicket(moduleNumber, ticketNumber) {
    const seller = sellers.find(s => s.moduleNumber === moduleNumber);
    if (seller) {
        seller.takenTickets = seller.takenTickets.filter(ticket => ticket !== ticketNumber);
        if (seller.takenTickets.length === 0) {
            seller.state = 'Attending';
            clearInterval(callingInterval);
            document.getElementById(`module-${seller.moduleNumber}`).style.color = '#000000'; // Back to default color
        }
        seller.stateStartTime = new Date();  // Reset the state start time

        displaySellers(sellers);
    } else {
        alert('Invalid module number.');
    }
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
