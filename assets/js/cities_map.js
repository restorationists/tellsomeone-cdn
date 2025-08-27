// UK Cities Map Component
// Usage: createUKCitiesMap('mapContainerId', options)

function createUKCitiesMap(containerId, options = {}) {
    // Default options
    const defaults = {
        center: [53.5, -2.0],
        zoom: 6,
        zoomControl: true,
        showAttribution: true,
        markerColor: '#e23e9a',
        markerRadius: 8,
        popupTemplate: (cityName) => `<strong>${cityName}</strong><br>Confirmed cases documented`
    };
    
    // Merge options
    const config = { ...defaults, ...options };
    
    // Wait for Leaflet to be available
    if (typeof L === 'undefined') {
        console.error('Leaflet library not found. Make sure it\'s loaded before this script.');
        return null;
    }
    
    // Check if container exists
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id "${containerId}" not found.`);
        return null;
    }
    
    // Initialize map
    const map = L.map(containerId, {
        center: config.center,
        zoom: config.zoom,
        zoomControl: config.zoomControl
    });

    // Add OpenStreetMap tiles
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: config.showAttribution ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' : ''
    }).addTo(map);

    // Cities with documented cases
    const cities = [
        {name: "Aylesbury", lat: 51.8148, lng: -0.8147},
        {name: "Banbury", lat: 52.0632, lng: -1.3371},
        {name: "Blackburn", lat: 53.7500, lng: -2.4833},
        {name: "Blackpool", lat: 53.8175, lng: -3.0357},
        {name: "Bradford", lat: 53.7960, lng: -1.7594},
        {name: "Brierfield", lat: 53.8237, lng: -2.2361},
        {name: "Bristol", lat: 51.4545, lng: -2.5879},
        {name: "Burton-on-Trent", lat: 52.8067, lng: -1.6424},
        {name: "Coventry", lat: 52.4068, lng: -1.5197},
        {name: "Derby", lat: 52.9225, lng: -1.4746},
        {name: "Dewsbury", lat: 53.6906, lng: -1.6281},
        {name: "Batley", lat: 53.7123, lng: -1.6358},
        {name: "Glasgow", lat: 55.8642, lng: -4.2518},
        {name: "Halifax", lat: 53.7218, lng: -1.8746},
        {name: "High Wycombe", lat: 51.6280, lng: -0.7483},
        {name: "Huddersfield", lat: 53.6458, lng: -1.7850},
        {name: "Hull", lat: 53.7457, lng: -0.3367},
        {name: "Hulme", lat: 53.4644, lng: -2.2447},
        {name: "Ilford", lat: 51.5590, lng: 0.0819},
        {name: "Ipswich", lat: 52.0587, lng: 1.1555},
        {name: "Leicester", lat: 52.6369, lng: -1.1398},
        {name: "Luton", lat: 51.8787, lng: -0.4200},
        {name: "Middlesbrough", lat: 54.5742, lng: -1.2351},
        {name: "Newcastle", lat: 54.9783, lng: -1.6178},
        {name: "Nottingham", lat: 52.9548, lng: -1.1581},
        {name: "Oldham", lat: 53.5409, lng: -2.1114},
        {name: "Oxford", lat: 51.7520, lng: -1.2577},
        {name: "Peterborough", lat: 52.5695, lng: -0.2405},
        {name: "Rochdale", lat: 53.6097, lng: -2.1561},
        {name: "Rotherham", lat: 53.4302, lng: -1.3572},
        {name: "Sheffield", lat: 53.3811, lng: -1.4701},
        {name: "Stockport", lat: 53.4106, lng: -2.1575},
        {name: "Telford", lat: 52.6761, lng: -2.4447}
    ];

    // Create markers array for bounds calculation
    const markers = [];

    // Add markers for each city
    cities.forEach(city => {
        const marker = L.circleMarker([city.lat, city.lng], {
            radius: config.markerRadius,
            fillColor: config.markerColor,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        marker.bindPopup(config.popupTemplate(city.name));
        markers.push(marker);
    });

    // Fit map to show all markers with padding
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    // Handle responsive resize
    const resizeObserver = new ResizeObserver(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    });
    resizeObserver.observe(container);

    // Return map instance and utility methods
    return {
        map: map,
        markers: markers,
        cities: cities,
        destroy: () => {
            resizeObserver.disconnect();
            map.remove();
        },
        resize: () => {
            map.invalidateSize();
        }
    };
}

// Auto-initialize maps with data attributes
document.addEventListener('DOMContentLoaded', function() {
    // Find all elements with data-uk-cities-map attribute
    const mapContainers = document.querySelectorAll('[data-uk-cities-map]');
    
    mapContainers.forEach(container => {
        const options = {};
        
        // Read options from data attributes
        if (container.dataset.markerColor) {
            options.markerColor = container.dataset.markerColor;
        }
        if (container.dataset.markerRadius) {
            options.markerRadius = parseInt(container.dataset.markerRadius);
        }
        if (container.dataset.showAttribution === 'false') {
            options.showAttribution = false;
        }
        if (container.dataset.zoomControl === 'false') {
            options.zoomControl = false;
        }
        
        // Initialize map
        createUKCitiesMap(container.id, options);
    });
});