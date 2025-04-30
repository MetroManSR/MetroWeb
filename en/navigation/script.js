async function getElevations() {
    const lat = document.getElementById('latitude').value;
    const lon = document.getElementById('longitude').value;

    try {
        // Use absolute path to avoid routing issues
        const response = await fetch(`/en/navigation/api/elevation?lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const elevation = data.results[0].elevation;
        document.getElementById('terrainOutput').value = `Elevation: ${elevation}m`;
    } catch (error) {
        console.error('Error:', error);
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
document.getElementById('generateBtn').addEventListener('click', getElevations);
