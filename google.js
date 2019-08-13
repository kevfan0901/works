var map;
var a = -1;
var markers = [];
function doFirst(){
	var service;
	var area = document.getElementById('myMap');
	var myPosition = new google.maps.LatLng(25.041347, 121.555197); 
	// get the start. 
	map = new google.maps.Map(area,{
		zoom: 17,
		center: myPosition,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});
	map.getCenter();

	new AutocompleteDirectionsHandler(map);
	service = new google.maps.places.PlacesService(map);

	//  more button change.
	var getNextPage = null;
	var moreButton = document.getElementById('more');
	moreButton.onclick = function() {
		moreButton.disabled = true;
		if (getNextPage) getNextPage();
	};
	// Perform a nearby search.
	function Place(){
		service.nearbySearch(
		{location: map.getCenter(), radius: 300, type: ['restaurant']},
		async function(results, status, pagination) {
		  if (status !== 'OK') return;
		  if (status === google.maps.places.PlacesServiceStatus.OK) {
			for (let i = 0; i < results.length; i++) {
			  var request = {
				placeId: results[i].place_id,
				fields: ['name', 'geometry']
			  }
			//   console.log(results[i]);
			  await service.getDetails(request, createMarkers(results[i],status));
			};
			// get the start
			var image = './meow.png';	
			var marker = new google.maps.Marker({
				position: myPosition,
				map: map,
				icon: image,
				title: 'RedSo',
			});
		  } else console.log("nearbySearch:"+status);

		  moreButton.disabled = !pagination.hasNextPage;
		  getNextPage = pagination.hasNextPage && function() {
			pagination.nextPage();
		  };
		}
		)
	};
	Place();
	// move the map, search agian..x
	google.maps.event.addListener(map, 'dragend', function() {
		clearMarkers();
		Place();
	});
}

function clearMarkers() {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
	markers = [];
	let parent = document.getElementById('places');
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	  }
}


function createMarkers(place, status) {
	// console.log(place);
	var infowindow = new google.maps.InfoWindow();
	var placesList = document.getElementById('places');
	// var bounds = new google.maps.LatLngBounds();

	// run the markers
	let lighting = './lighting.png';
	if (status === google.maps.places.PlacesServiceStatus.OK) {
	var marker = new google.maps.Marker({
		map: map,
		icon: lighting,
		title: place.name,
		position: place.geometry.location,
		animation: google.maps.Animation.DROP
	  });
	markers.push(marker);
	  // marker click show info
	  google.maps.event.addListener(marker, 'click', function() {
		a = a * -1;
		infowindow.setContent(place.name + "<br>"+"評分: " + place.rating +"顆星"+ "<br>"+"網址: " + place.url+ "<br>"+"地址: " + place.vicinity);
		if(a > 0){
			infowindow.open(map, this);
		}else{
			infowindow.close();
		}
		// setTimeout(function () { infowindow.close(); }, 2000);
	  });
	  // click map and marker info close   
	  google.maps.event.addListener(map, 'click', function() {
		infowindow.close();
	  });

	  var li = document.createElement('li');
	  li.textContent = place.name;
	  placesList.appendChild(li);
	  //click panel li connect to marker's infowindow
	  li.addEventListener('click', function(){
		a = a * -1;
		infowindow.setContent(place.name + "<br>"+"評分: " + place.rating +"顆星"+ "<br>"+"網址: " + place.url+ "<br>"+"地址: " + place.vicinity);
		if(a > 0){
			infowindow.open(map, marker);
		}else{
			infowindow.close();
		}
		// put place_id would be better	  
		let dest = document.getElementById('destination-input');
		dest.value = li.innerText;
	  });
	};  

}

// route enter
function AutocompleteDirectionsHandler(map) {
	this.map = map;
	this.originPlaceId = null;
	this.destinationPlaceId = null;
	this.travelMode = 'WALKING';
	this.directionsService = new google.maps.DirectionsService;
	this.directionsDisplay = new google.maps.DirectionsRenderer;
	this.directionsDisplay.setMap(map);

	var originInput = document.getElementById('origin-input');
	var destinationInput = document.getElementById('destination-input');
	var modeSelector = document.getElementById('mode-selector');

	var originAutocomplete = new google.maps.places.Autocomplete(originInput);
	originAutocomplete.setFields(['place_id']);

	var destinationAutocomplete =
		new google.maps.places.Autocomplete(destinationInput);
	destinationAutocomplete.setFields(['place_id']);

	this.setupClickListener('changemode-walking', 'WALKING');
	this.setupClickListener('changemode-transit', 'TRANSIT');
	this.setupClickListener('changemode-driving', 'DRIVING');

	this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
	this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

	this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
	this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(
		destinationInput);
	this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
	}

	// Sets a listener on a radio button to change the filter type on Places
	// Autocomplete.
	AutocompleteDirectionsHandler.prototype.setupClickListener = function(
		id, mode) {
	var radioButton = document.getElementById(id);
	var me = this;

	radioButton.addEventListener('click', function() {
		me.travelMode = mode;
		me.route();
	});
	};

	AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function(
		autocomplete, mode) {
	var me = this;
	autocomplete.bindTo('bounds', this.map);

	autocomplete.addListener('place_changed', function() {
		var place = autocomplete.getPlace();

		if (!place.place_id) {
		window.alert('Please select an option from the dropdown list.');
		return;
		}
		// change the original place to the specific place_id
		me.originPlaceId = 'ChIJV5wGcMarQjQRtgFBSJRJhK4';
		me.destinationPlaceId = place.place_id;

		me.route();
	});
	};

	AutocompleteDirectionsHandler.prototype.route = function() {
	if (!this.originPlaceId || !this.destinationPlaceId) {
		return;
	}
	var me = this;

	this.directionsService.route(
		{
			origin: {'placeId': 'ChIJV5wGcMarQjQRtgFBSJRJhK4'},
			destination: {'placeId': this.destinationPlaceId},
			travelMode: this.travelMode
		},
		function(response, status) {
			if (status === 'OK') {
			me.directionsDisplay.setDirections(response);
			} else {
			window.alert('Directions request failed due to ' + status);
			}
	});
};


window.addEventListener('load',doFirst);