import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '500px'
};

const center = {
  lat: 32.7157,
  lng: -117.1611
};

function MapComponent() {
  const [address, setAddress] = useState('');
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const mapRef = useRef(null);
  const geocoder = useRef(null);

  useEffect(() => {
    // Initialize geocoder when the component mounts
    geocoder.current = new window.google.maps.Geocoder();
  }, []);

  const geocodeAddress = () => {
    if (address === '') return;

    geocoder.current.geocode({ address }, (results, status) => {
      if (status === 'OK') {
        const location = results[0].geometry.location;
        mapRef.current.panTo(location);
        mapRef.current.setZoom(14);

        const newMarker = {
          position: location,
          address: address
        };

        setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
      } else {
        alert(`Geocode was not successful: ${status}`);
      }
    });
  };

  const removeMarker = (index) => {
    setMarkers((prevMarkers) => prevMarkers.filter((_, i) => i !== index));
    setSelectedMarker(null);
  };

  const clearMarkers = () => {
    setMarkers([]);
    setSelectedMarker(null);
  };

  return (
    <div>
      <h2>Enter an Address:</h2>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Enter address"
      />
      <button onClick={geocodeAddress}>Show on Map</button>
      <button onClick={clearMarkers}>Clear All Markers</button>

      <LoadScript key={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          id="map"
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={(map) => (mapRef.current = map)}
        >
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={marker.position}
              onClick={() => setSelectedMarker(marker)}
            />
          ))}

          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div>
                <p><strong>{selectedMarker.address}</strong></p>
                <button onClick={() => removeMarker(markers.indexOf(selectedMarker))}>
                  Remove Marker
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

export default MapComponent;
