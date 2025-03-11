import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '500px'
};

const center = {
  lat: 32.7157,
  lng: -117.1611
};

function MapComponent() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  


  const [address, setAddress] = useState('');
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);

  useEffect(() => {
    if (window.google) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, []);

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const geocodeAddress = useCallback(() => {
    if (!geocoderRef.current || address.trim() === '') return;

    geocoderRef.current.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        mapRef.current.panTo(location);
        mapRef.current.setZoom(14);

        setMarkers((prev) => [...prev, { position: location, address }]);
      } else {
        alert(`Geocode failed: ${status}`);
      }
    });
  }, [address]);

  const removeMarker = useCallback((index) => {
    setMarkers((prev) => prev.filter((_, i) => i !== index));
    setSelectedMarker(null);
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
    setSelectedMarker(null);
  }, []);

  if (loadError) return <p>Error loading maps</p>;
  if (!isLoaded) return <p>Loading maps...</p>;

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

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={handleMapLoad}
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
    </div>
  );
}

export default MapComponent;
