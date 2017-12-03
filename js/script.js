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
  var styles = [
    {
      featureType: 'water',
      stylers: [
        { color: '#19a0d8' }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: '#ffffff' },
        { weight: 6 }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.fill',
      stylers: [
        { color: '#e85113' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -40 }
      ]
    },{
      featureType: 'transit.station',
      stylers: [
        { weight: 9 },
        { hue: '#e85113' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'labels.icon',
      stylers: [
        { visibility: 'off' }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [
        { lightness: 100 }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        { lightness: -100 }
      ]
    },{
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        { visibility: 'on' },
        { color: '#f0e4d3' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -25 }
      ]
    }
  ];

  // Constructor creates a new map.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 52.520008, lng: 13.404954},
    zoom: 13,
    styles: styles,
    mapTypeControl: false
  });
  largeInfoWindow = new google.maps.InfoWindow();
  ko.applyBindings(new ViewModel());
};

var Location = function(data) {
  var self = this;

  this.title = data.title;
  this.location = data.location;
  this.wikiArticles = '<ul id="wiki">';

  this.visible = ko.observable(true);

  var defaultIcon = makeMarkerIcon('0091ff');

  var highlightedIcon = makeMarkerIcon('FFFF24');

  // Wikipedia AJAX request
  var wiki_url = "https://en.wikipedia.org/w/api.php"
  wiki_url += '?' + $.param({
    'action': "opensearch",
    'search': this.title,
    'format': "json",
    'callback': "wikiCallback"
  });

  var wikiRequestTimeout = setTimeout(function(){
    alert("failed to get wikipedia resources");
  }, 8000);


  $.ajax({
    url: wiki_url,
    dataType: 'jsonp',
    // jsonp: "callback",
    success: function( response ) {
      var articleList = response[1];

      for (var i=0; i < articleList.length; i++) {
        articleStr = articleList[i];
        var url = 'https://en.wikipedia.org/wiki/' + articleStr;
        self.wikiArticles += '<li><a href="' + url + '">' + articleStr + '</a></li>';
      };
      self.wikiArticles += '</ul>';
      clearTimeout(wikiRequestTimeout);
    }
  });

  this.marker = new google.maps.Marker({
      //map: map,
      position: this.location,
      title: this.title,
      icon: defaultIcon,
      animation: google.maps.Animation.DROP,
  });

  this.marker.addListener('click', function() {
    populateInfoWindow(this, self.wikiArticles, largeInfoWindow);
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

  this.highlightMarker = function() {
    google.maps.event.trigger(self.marker, 'mouseover');
  };

  this.lowlightMarker = function() {
    google.maps.event.trigger(self.marker, 'mouseout');
  };
}

var ViewModel = function() {
  var self = this;

  this.locationList = ko.observableArray([]);

  initialLocations.forEach(function(locationItem) {
    self.locationList.push(new Location(locationItem));
  });

  this.filterInput = ko.observable('');


  this.filterList = ko.computed(function() {
    var filterItem = this.filterInput().toLowerCase();
    if (!filterItem) {
      this.locationList().forEach(function(locationItem) {
        locationItem.visible(true);
        locationItem.marker.setMap(map);
      });
      return this.locationList();
    } else {
        return ko.utils.arrayFilter(this.locationList(), function(locationItem) {
          var lowerCaseTitle = locationItem.title.toLowerCase();
          var result = (lowerCaseTitle.search(filterItem) >= 0);
          locationItem.visible(result);
          if (result) {
            locationItem.marker.setMap(map);
          } else {
            locationItem.marker.setMap(null);
          }
          return result;
        });
      }
    }, this);
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

function populateInfoWindow(marker, wikiArticles, infowindow) {
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
          infowindow.setContent('<div>' + '<h3>' + marker.title + '</h3>' + '<h4>Relevant Wikipedia Articles</h4>' + wikiArticles + '</div><div id="pano"></div>');
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

function googleError() {
  alert('There went something wrong when loading Google Maps - please try again!');
}
