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

    for (const loc of locations) {
        try {
            const response = await fetch(`https://api.opentopodata.org/v1/srtm30m?locations=${loc.lat},${loc.lon}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            elevationData.push(data.results[0].elevation);
        } catch (error) {
            console.error('Error fetching elevation:', error);
            elevationData.push(0); // Default value if fetch fails
        }
    }

    visualizeElevation(elevationData);
}

function visualizeElevation(elevations) {
    let visualization = elevations.map(elev => {
        if (elev < 200) return ".";
        else if (elev < 1000) return "o";
        else return "▲";
    }).join("");

    document.getElementById('terrainOutput').value = "ASCII Terrain Map:\n" + visualization;
}
