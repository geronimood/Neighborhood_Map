var map;
function initMap() {
  // Constructor creates a new map.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 52.520008, lng: 13.404954},
    zoom: 13,
    mapTypeControl: false
  });
};
