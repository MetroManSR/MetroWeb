async function getElevations() {
    const latInput = document.getElementById('latitude').value;
    const lonInput = document.getElementById('longitude').value;
    
    // Validate inputs
    if (!latInput || !lonInput) {
        alert("Please enter both latitude and longitude");
        return;
    }

    // Replace commas with periods for decimal numbers
    const lat = latInput.replace(',', '.');
    const lon = lonInput.replace(',', '.');

    try {
        const response = await fetch(`/en/navigation/api/elevation?lat=${lat}&lon=${lon}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        visualizeElevation([data.results[0].elevation]);
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('terrainOutput').value = "Error fetching elevation data";
    }
}

function visualizeElevation(elevations) {
    let visualization = elevations.map(elev => {
        if (elev < 200) return ".";
        else if (elev < 1000) return "o";
        else return "▲";
    }).join("");

    document.getElementById('terrainOutput').value = `ASCII Terrain Map:\n\n${visualization}\n\nElevations: ${elevations.join(', ')} meters`;
}

// Handle button click
// Wait for DOM to load before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', getElevations);
    } else {
        console.error('Generate button not found!');
    }
});
