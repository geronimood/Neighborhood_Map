var map;
var largeInfoWindow
var markers = [];

var initialLocations = [
  {
    title: 'Brandenburger Tor',
    location: {lat: 52.516266, lng: 13.377775}
  },
  {
    title: 'Alexanderplatz',
    location: {lat: 52.521918, lng: 13.413215}
  },
  {
    title: 'Potsdamer Platz',
    location: {lat: 52.509663, lng: 13.376481}
  },
  {
    title: 'Mauerpark',
    location: {lat: 52.544937, lng: 13.402677}
  },
  {
    title: 'Reichstag',
    location: {lat: 52.518623, lng: 13.376198}
  }
];

function initMap() {
  // Constructor creates a new map.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 52.520008, lng: 13.404954},
    zoom: 13,
    mapTypeControl: false
  });
  largeInfoWindow = new google.maps.InfoWindow();
  ko.applyBindings(new ViewModel());
};

var Location = function(data) {
  var self = this;

  this.title = data.title;
  this.location = data.location;

  this.visible = ko.observable(true);

  var defaultIcon = makeMarkerIcon('0091ff');

  var highlightedIcon = makeMarkerIcon('FFFF24');

  for (var i = 0; i < initialLocations.length; i++) {
    var position = initialLocations[i].location;
    var title = initialLocations[i].title;
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      icon: defaultIcon,
      animation: google.maps.Animation.DROP,
      id: i
    });

    markers.push(marker);

    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfoWindow);
    });

    marker.addListener('mouseover', function() {
      this.setIcon(highlightedIcon);
    });

    marker.addListener('mouseout', function() {
      this.setIcon(defaultIcon);
    });
  };
}

var ViewModel = function() {
  var self = this;

  this.locationList = ko.observableArray([]);

  initialLocations.forEach(function(locationItem) {
    self.locationList.push(new Location(locationItem));
  });
};

function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21,34),
    new google.maps.Point(0,0),
    new google.maps.Point(10,34),
    new google.maps.Size(21,34));
  return markerImage;
};

function populateInfoWindow(marker, infowindow) {
  if (infowindow.marker != marker) {
    infowindow.marker = marker;
    infowindow.setContent('<div>' + marker.title);
    infowindow.addListener('closeclick', function() {
      infowindow.setMarker = null;
    });
    infowindow.open(map, marker);
  }
}
