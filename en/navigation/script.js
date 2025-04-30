async function getElevations() {
    const locations = [
        { lat: -33.4489, lon: -70.6693 },  // Example: Santiago, Chile
        { lat: -33.4500, lon: -70.6700 },
        { lat: -33.4510, lon: -70.6710 }
    ];

    let elevationData = [];

    for (const loc of locations) {
        const response = await fetch(`https://api.opentopodata.org/v1/srtm30m?locations=${loc.lat},${loc.lon}`);
        const data = await response.json();
        elevationData.push(data.results[0].elevation);
    }

    visualizeElevation(elevationData);
}

function visualizeElevation(elevations) {
    let visualization = elevations.map(elev => {
        if (elev < 200) return ".";
        else if (elev < 1000) return "o";
        else return "▲";
    }).join("");

    console.log("ASCII Terrain Map:");
    console.log(visualization);
}
