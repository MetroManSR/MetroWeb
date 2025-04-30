async function getElevation() {
    const lat = document.getElementById('latitude').value;
    const lon = document.getElementById('longitude').value;
    const result = document.getElementById('result');

    if (!lat || !lon) {
        result.innerText = "Please enter both latitude and longitude!";
        return;
    }

    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        result.innerText = `Elevation: ${data.results[0].elevation} meters`;
    } catch (error) {
        result.innerText = "Error fetching elevation data.";
    }
}
