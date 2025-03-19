import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';
import logo from '../assets/logo.png'; // Import the logo

const containerStyle = {
  width: '100%',
  height: '500px',
};

const center = {
  lat: 32.7157,
  lng: -117.1611,
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

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://hawthorn-backend-565258057453.us-central1.run.app';

  useEffect(() => {
    if (isLoaded && window.google) {
      geocoderRef.current = new window.google.maps.Geocoder();
      console.log('Google Maps Loaded!');
    } else {
      console.warn('Google Maps NOT Loaded!');
    }
  }, [isLoaded]);

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const geocodeAddress = useCallback(() => {
    if (!isLoaded || !geocoderRef.current || address.trim() === '') {
      console.warn('Geocoder not ready or address is empty');
      return;
    }
    geocoderRef.current.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        mapRef.current.panTo(location);
        mapRef.current.setZoom(14);
        setMarkers((prev) => [...prev, { position: location, address, isFromBackend: false }]);
        setAddress('');
      } else {
        alert(`Geocode failed: ${status}`);
      }
    });
  }, [address, isLoaded]);

  const fetchHomes = useCallback(async () => {
    if (!isLoaded) {
      console.warn('Google Maps not loaded yet');
      return;
    }
    try {
      const response = await axios.get(`${backendUrl}/api/homes`);
      const homes = response.data.map((home) => ({
        position: { lat: home.lat, lng: home.lng },
        address: home.address,
        salesPrice: home.salesPrice,
        soldDate: home.soldDate,
        link: home.link,
        isFromBackend: true,
      }));
      setMarkers((prev) => [...prev, ...homes]);
    } catch (error) {
      console.error('Error fetching homes from backend:', error);
      alert('Failed to fetch homes from backend');
    }
  }, [isLoaded, backendUrl]);

  const removeMarker = useCallback((index) => {
    setMarkers((prev) => prev.filter((_, i) => i !== index));
    setSelectedMarker(null);
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers((prev) => prev.filter((marker) => marker.isFromBackend));
    setSelectedMarker(null);
  }, []);

  if (loadError) {
    console.error('Google Maps Load Error:', loadError);
    return <p>Error loading maps: {loadError.message}</p>;
  }
  if (!isLoaded) return <p>Loading maps...</p>;

  return (
    <div style={styles.pageContainer}>
      {/* Header with Logo */}
      <header style={styles.header}>
        <img src={logo} alt="Hawthorn Logo" style={styles.logo} />
        <h1 style={styles.title}>Hawthorn Flipped Homes Map</h1>
      </header>

      {/* Input and Buttons */}
      <div style={styles.controls}>
        <h2 style={styles.subtitle}>Enter an Address:</h2>
        <div style={styles.inputContainer}>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
            style={styles.input}
          />
          <button onClick={geocodeAddress} style={styles.button}>
            Show on Map
          </button>
          <button onClick={fetchHomes} style={styles.button}>
            Load Flipped Homes
          </button>
          <button onClick={clearMarkers} style={styles.button}>
            Clear Manual Markers
          </button>
        </div>
      </div>

      {/* Map */}
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
            icon={
              marker.isFromBackend
                ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                : undefined
            }
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div style={styles.infoWindow}>
              <p><strong>Address:</strong> {selectedMarker.address}</p>
              {selectedMarker.isFromBackend && (
                <>
                  <p><strong>Sales Price:</strong> {selectedMarker.salesPrice}</p>
                  <p><strong>Sold Date:</strong> {selectedMarker.soldDate}</p>
                  <p><strong>Link:</strong> <a href={selectedMarker.link} target="_blank" rel="noopener noreferrer">View on Redfin</a></p>
                </>
              )}
              {!selectedMarker.isFromBackend && (
                <button onClick={() => removeMarker(markers.indexOf(selectedMarker))} style={styles.infoWindowButton}>
                  Remove Marker
                </button>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

// Inline styles for now (we'll move to CSS later if preferred)
const styles = {
  pageContainer: {
    fontFamily: "'Roboto', sans-serif",
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  logo: {
    width: '60px',
    height: '60px',
    marginRight: '15px',
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    fontWeight: '700',
    margin: 0,
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#555',
    marginBottom: '10px',
    textAlign: 'center',
  },
  controls: {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '800px',
  },
  inputContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
  },
  input: {
    padding: '10px',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '5px',
    outline: 'none',
    flex: '1 1 300px',
    maxWidth: '400px',
    transition: 'border-color 0.3s',
  },
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    color: '#fff',
    backgroundColor: '#333',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s, transform 0.1s',
  },
  infoWindow: {
    fontSize: '0.9rem',
    color: '#333',
  },
  infoWindowButton: {
    padding: '5px 10px',
    fontSize: '0.9rem',
    color: '#fff',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    marginTop: '5px',
  },
};

// Add hover/focus effects via CSS
const styleSheet = document.createElement('style');
styleSheet.innerText = `
  input:focus {
    border-color: #333 !important;
  }
  button:hover {
    background-color: #555 !important;
    transform: scale(1.05);
  }
  button:active {
    transform: scale(0.95);
  }
`;
document.head.appendChild(styleSheet);

export default MapComponent;