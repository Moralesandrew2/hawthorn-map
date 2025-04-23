import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';
import logo from '../assets/logo.png';

const containerStyle = {
  width: '100%',
  height: '500px',
};

const center = {
  lat: 32.7157, // San Diego
  lng: -117.1611,
};

function MapComponent() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const [address, setAddress] = useState('');
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showCompForm, setShowCompForm] = useState(false);
  const [compData, setCompData] = useState({
    address: '',
    bedCount: '',
    bathCount: '',
    squareFootage: '',
    yearBuilt: '',
    arv: '',
  });

  
  const [selectedRange, setSelectedRange] = useState('all');

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

  const fetchComps = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/comps`);
      const compMarkers = res.data.map((comp) => ({
        position: { lat: comp.lat, lng: comp.lng },
        address: comp.address,
        bedCount: comp.bedCount,
        bathCount: comp.bathCount,
        squareFootage: comp.squareFootage,
        yearBuilt: comp.yearBuilt,
        arv: comp.arv,
        isFromBackend: true,
        isComp: true, // Distinguish comps
      }));
      setMarkers((prev) => [
        ...prev.filter((marker) => !marker.isComp), // Remove existing comps to avoid duplicates
        ...compMarkers,
      ]);
    } catch (err) {
      console.error('Error fetching comps:', err);
      alert('Failed to fetch comps');
    }
  }, [backendUrl]);

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
        setMarkers((prev) => [
          ...prev,
          { position: location, address, isFromBackend: false, isComp: false },
        ]);
        setAddress('');
      } else {
        alert(`Geocode failed: ${status}`);
      }
    });
  }, [address, isLoaded]);

  const fetchHomes = useCallback(
    async (range = 'all') => {
      if (!isLoaded) {
        console.warn('Google Maps not loaded yet');
        return;
      }
  
      try {
        const response = await axios.get(`${backendUrl}/api/homes`, {
          params: { range },
        });
  
        const homes = response.data.map((home) => ({
          position: { lat: home.lat, lng: home.lng },
          address: home.address,
          salesPrice: home.salesPrice,
          soldDate: home.soldDate,
          link: home.link,
          isFromBackend: true,
          isComp: false,
        }));
  
        setMarkers((prev) => [
          ...prev.filter((marker) => !marker.isFromBackend || marker.isComp),
          ...homes,
        ]);
      } catch (error) {
        console.error('Error fetching homes from backend:', error);
        alert('Failed to fetch homes from backend');
      }
    },
    [isLoaded, backendUrl]
  );
  

  

  const removeMarker = useCallback((index) => {
    setMarkers((prev) => prev.filter((_, i) => i !== index));
    setSelectedMarker(null);
  }, []);

  const clearManualMarkers = useCallback(() => {
    setMarkers((prev) => prev.filter((marker) => marker.isFromBackend));
    setSelectedMarker(null);
  }, []);

  const clearFlippedHomes = useCallback(() => {
    setMarkers((prev) => prev.filter((marker) => !marker.isFromBackend || marker.isComp));
    setSelectedMarker(null);
  }, []);

  const clearAllMarkers = useCallback(() => {
    setMarkers([]);
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
          <button onClick={() => fetchHomes(selectedRange)} style={styles.button}>
            Load Flipped Homes
          </button>
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            style={{ marginRight: '0.5rem' }}
          >
            <option value="all">All Time</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last 1 Year</option>
            <option value="2years">Last 2 Years</option>
          </select>
          <button onClick={clearManualMarkers} style={styles.button}>
            Clear Manual Markers
          </button>
          <button onClick={clearFlippedHomes} style={styles.button}>
            Clear Flipped Homes
          </button>
          <button onClick={clearAllMarkers} style={styles.button}>
            Clear All Markers
          </button>
          <button onClick={() => setShowCompForm(true)} style={styles.button}>
            Save Analyzed Home
          </button>
          <button onClick={fetchComps} style={styles.button}>
            Load Recent Analyzed Homes
          </button>
        </div>
      </div>
      <div style={{ position: 'relative', height: '100%' }}></div>
      <div style={{ width: '100%', height: '500px', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          zIndex: 10
        }}>
          <h4 style={{ margin: '0 0 6px' }}>Legend</h4>
          <div><span style={{ color: 'blue', fontWeight: 'bold' }}>●</span> Flipped Homes</div>
          <div><span style={{ color: 'green', fontWeight: 'bold' }}>●</span> Recently Analyzed</div>
          <div><span style={{ color: 'red', fontWeight: 'bold' }}>●</span> Manual Marker</div>
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
                  ? {
                      url: marker.isComp
                        ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                        : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    }
                  : undefined
              }
              title={marker.address}
            />
          ))}
          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div style={styles.infoWindow}>
                <p>
                  <strong>Address:</strong> {selectedMarker.address}
                </p>
                {selectedMarker.isFromBackend && !selectedMarker.isComp && (
                  <>
                    <p>
                      <strong>Sales Price:</strong>{' '}
                      {selectedMarker.salesPrice
                        ? `$${selectedMarker.salesPrice.toLocaleString()}`
                        : 'N/A'}
                    </p>
                    <p>
                      <strong>Sold Date:</strong>{' '}
                      {selectedMarker.soldDate
                        ? new Date(selectedMarker.soldDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <p>
                      <strong>Link:</strong>{' '}
                      <a
                        href={selectedMarker.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Redfin
                      </a>
                    </p>
                  </>
                )}
                {selectedMarker.isFromBackend && selectedMarker.isComp && (
                  <>
                    <p>
                      <strong>Beds:</strong> {selectedMarker.bedCount || 'N/A'}
                    </p>
                    <p>
                      <strong>Baths:</strong> {selectedMarker.bathCount || 'N/A'}
                    </p>
                    <p>
                      <strong>Square Footage:</strong>{' '}
                      {selectedMarker.squareFootage
                        ? `${selectedMarker.squareFootage.toLocaleString()} sq ft`
                        : 'N/A'}
                    </p>
                    <p>
                      <strong>Year Built:</strong> {selectedMarker.yearBuilt || 'N/A'}
                    </p>
                    <p>
                      <strong>Lot Size:</strong>{' '}
                      {selectedMarker.lotSize
                        ? `${selectedMarker.lotSize.toLocaleString()} sq ft`
                        : 'N/A'}
                    </p>
                    <p>
                      <strong>ARV:</strong>{' '}
                      {selectedMarker.arv
                        ? `$${selectedMarker.arv.toLocaleString()}`
                        : 'N/A'}
                    </p>
                  </>
                )}
                {!selectedMarker.isFromBackend && (
                  <button
                    onClick={() => removeMarker(markers.indexOf(selectedMarker))}
                    style={styles.infoWindowButton}
                  >
                    Remove Marker
                  </button>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Comp Form Modal */}
      {showCompForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Save an Analyzed Home</h2>
            {Object.keys(compData).map((field) => (
              <div key={field} style={styles.formGroup}>
                <label style={styles.label}>
                  {field
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())}
                </label>
                <input
                  type={field === 'address' ? 'text' : 'number'}
                  value={compData[field]}
                  onChange={(e) =>
                    setCompData({ ...compData, [field]: e.target.value })
                  }
                  style={styles.input}
                  placeholder={``}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                style={{ ...styles.button, backgroundColor: '#2ecc71' }}
                onClick={async () => {
                  try {
                    await axios.post(`${backendUrl}/api/comps`, {
                      ...compData,
                      bedCount: Number(compData.bedCount) || undefined,
                      bathCount: Number(compData.bathCount) || undefined,
                      squareFootage: Number(compData.squareFootage) || undefined,
                      yearBuilt: Number(compData.yearBuilt) || undefined,
                      arv: Number(compData.arv) || undefined,
                    });
                    alert('Analyzed Home Saved!');
                    setShowCompForm(false);
                    setCompData({
                      address: '',
                      bedCount: '',
                      bathCount: '',
                      squareFootage: '',
                      yearBuilt: '',
                      arv: '',
                    });
                    fetchComps(); // Refresh comps after saving
                  } catch (err) {
                    console.error('Error saving comp:', err);
                    alert('Error saving home data. Please try again.');
                  }
                }}
              >
                Save
              </button>
              <button
                style={{ ...styles.button, backgroundColor: '#e74c3c' }}
                onClick={() => setShowCompForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
    maxWidth: '200px',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '1.5rem',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: '10px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#555',
    fontSize: '0.95rem',
  },
};

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