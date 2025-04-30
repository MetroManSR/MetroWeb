async function getElevations() {
    const latInput = document.getElementById('latitude').value;
    const lonInput = document.getElementById('longitude').value;
    
    if (!latInput || !lonInput) {
        alert("Please enter both latitude and longitude");
        return;
    }

    const locations = [
        { lat: parseFloat(latInput), lon: parseFloat(lonInput) },
        { lat: parseFloat(latInput) + 0.001, lon: parseFloat(lonInput) + 0.001 },
        { lat: parseFloat(latInput) + 0.002, lon: parseFloat(lonInput) + 0.002 }
    ];

    let elevationData = [];
    const terrainOutput = document.getElementById('terrainOutput');
    terrainOutput.value = "Loading elevation data...";

    try {
        for (const loc of locations) {
            const response = await fetch(`/api/elevation?lat=${loc.lat}&lon=${loc.lon}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            elevationData.push(data.results[0].elevation);
        }
        visualizeElevation(elevationData);
    } catch (error) {
        console.error('Error:', error);
        terrainOutput.value = "Failed to load elevation data. Please try again later.";
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
