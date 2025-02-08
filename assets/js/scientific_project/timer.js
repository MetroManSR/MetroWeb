import { sellers } from './sellers.js';

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
