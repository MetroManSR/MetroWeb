async function getElevations() {
    const lat = document.getElementById('latitude').value;
    const lon = document.getElementById('longitude').value;
    
    try {
        // Directly call OpenTopoData's SRTM endpoint
        const response = await fetch(`https://api.opentopodata.org/v1/srtm30m?locations=${lat},${lon}`);
        
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        const elevation = data.results[0].elevation;
        visualizeElevation([elevation]);
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('terrainOutput').value = "Error fetching elevation";
    }
}

function visualizeElevation(elevations) {
    const symbols = elevations.map(elev => {
        if (elev < 200) return ".";
        else if (elev < 1000) return "o";
        else return "▲";
    }).join("");
    
    document.getElementById('terrainOutput').value = symbols;
}

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateBtn')?.addEventListener('click', getElevations);
});
