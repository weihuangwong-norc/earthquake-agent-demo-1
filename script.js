(function () {
  'use strict';

  var USGS_FEED =
    'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';

  // Initialise map centred on the world
  var map = L.map('map').setView([20, 0], 2);

  // OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  // Colour by magnitude
  function getColor(mag) {
    if (mag >= 5) return '#e74c3c';   // red
    if (mag >= 3) return '#f1c40f';   // yellow
    return '#2ecc71';                 // green
  }

  // Radius scaled by magnitude (minimum 3 px to stay visible)
  function getRadius(mag) {
    return Math.max(3, mag * 3);
  }

  // Show a human-readable error on the page
  function showError(message) {
    var el = document.getElementById('error-message');
    el.textContent = message;
    el.hidden = false;
  }

  // Fetch and render earthquakes
  fetch(USGS_FEED)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Network response was not OK (' + response.status + ')');
      }
      return response.json();
    })
    .then(function (data) {
      if (!data.features || data.features.length === 0) {
        showError('No earthquake data was returned from the USGS feed.');
        return;
      }

      data.features.forEach(function (feature) {
        var props = feature.properties;
        var coords = feature.geometry && feature.geometry.coordinates;
        if (!coords) return;

        var lon = coords[0];
        var lat = coords[1];
        var mag = props.mag != null ? props.mag : 0;
        var place = props.place || 'Unknown location';
        var timeStr = props.time
          ? new Date(props.time).toLocaleString()
          : 'Unknown time';

        L.circleMarker([lat, lon], {
          radius: getRadius(mag),
          fillColor: getColor(mag),
          color: '#fff',
          weight: 0.8,
          opacity: 1,
          fillOpacity: 0.75,
        })
          .bindPopup(
            '<strong>' + place + '</strong><br/>' +
            'Magnitude: ' + mag + '<br/>' +
            'Time: ' + timeStr
          )
          .addTo(map);
      });
    })
    .catch(function (err) {
      showError(
        'Failed to load earthquake data from USGS. ' +
        'Please check your connection and try again. (' + err.message + ')'
      );
    });

  // Add legend
  var legend = L.control({ position: 'bottomright' });
  legend.onAdd = function () {
    var div = L.DomUtil.create('div', 'legend');
    div.innerHTML =
      '<h4>Magnitude</h4>' +
      '<div class="legend-item">' +
        '<span class="legend-swatch" style="background:#2ecc71;"></span>' +
        '&lt; 3' +
      '</div>' +
      '<div class="legend-item">' +
        '<span class="legend-swatch" style="background:#f1c40f;"></span>' +
        '3 – 5' +
      '</div>' +
      '<div class="legend-item">' +
        '<span class="legend-swatch" style="background:#e74c3c;"></span>' +
        '&gt; 5' +
      '</div>';
    return div;
  };
  legend.addTo(map);
})();
