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

  this.marker = new google.maps.Marker({
      map: map,
      position: this.location,
      title: this.title,
      icon: defaultIcon,
      animation: google.maps.Animation.DROP,
  });

  this.marker.addListener('click', function() {
    populateInfoWindow(this, largeInfoWindow);
  });

  this.marker.addListener('mouseover', function() {
    this.setIcon(highlightedIcon);
  });

  this.marker.addListener('mouseout', function() {
    this.setIcon(defaultIcon);
  });

  this.showInfoWindow = function() {
    google.maps.event.trigger(self.marker, 'click');
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
    infowindow.setContent('');
    infowindow.addListener('closeclick', function() {
      infowindow.setMarker = null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;

    function getStreetView(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
          infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 30
            }
          };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infowindow.setContent('<div>' + marker.title + '<div>' + '<div>No Street View Found</div>');
      }
    }
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    infowindow.open(map, marker);
  }
};
