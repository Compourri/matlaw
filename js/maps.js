function initMap() {
    var mapEl = document.getElementById('map');
    if (!mapEl || typeof google === 'undefined') return;

    var position = { lat: -26.4928, lng: 27.4930 };

    new google.maps.Map(mapEl, {
        center: position,
        zoom: 16,
        disableDefaultUI: true,
        styles: [
            { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#cccccc' }] },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#166432' }]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#e0e0e0' }]
            },
            {
                featureType: 'poi',
                elementType: 'geometry',
                stylers: [{ color: '#2a2a2a' }]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#c59d55' }]
            },
            {
                featureType: 'administrative',
                elementType: 'geometry',
                stylers: [{ color: '#333333' }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#0d2616' }]
            },
            {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [{ color: '#222222' }]
            }
        ]
    });

    var icon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#c59d55',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
    };

    new google.maps.Marker({
        position: position,
        map: map,
        icon: icon,
        title: 'Matthee Attorneys Inc'
    });
}
