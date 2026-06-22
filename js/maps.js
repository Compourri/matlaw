function initMap() {
    var mapEl = document.getElementById('map');
    if (!mapEl || typeof google === 'undefined') return;

    var position = { lat: -26.4923, lng: 27.4970 };

    var map = new google.maps.Map(mapEl, {
        center: position,
        zoom: 17,
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

    var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: 'Matthee Attorneys Inc.'
    });

    var infoWindow = new google.maps.InfoWindow({
        content: '<div style="color:#000;font-family:sans-serif;font-size:13px;line-height:1.4"><strong>Matthee Attorneys Inc.</strong><br>49 Kerk Street<br>Fochville, Gauteng 2515<br>Tel: 018 771 2041</div>'
    });

    marker.addListener('click', function() {
        infoWindow.open(map, marker);
    });

    infoWindow.open(map, marker);
}
