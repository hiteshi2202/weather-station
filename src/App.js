import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const backgroundImages = {
  morning:   'https://github.com/desaiayush487-oss/weather-bg/blob/main/morning.jpg?raw=true',
  afternoon: 'https://github.com/desaiayush487-oss/weather-bg/blob/main/afternoon.jpg?raw=true',
  evening:   'https://github.com/desaiayush487-oss/weather-bg/blob/main/evening.jpg?raw=true',
  night:     'https://github.com/desaiayush487-oss/weather-bg/blob/main/night.jpg?raw=true'
};

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [localData, setLocalData] = useState(null);
  const [bgImage, setBgImage] = useState(backgroundImages.morning);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_KEY = '112ffe8f9ebf47a0aa872931251311';

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchAllData(latitude, longitude);
        },
        () => {
          setError("Location access denied. Please enable location permission.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported by browser.");
      setLoading(false);
    }
  }, []);

  const fetchAllData = async (lat, lon) => {
    try {
      // Internet Weather Fetch
      const weatherUrl = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${lat},${lon}`;
      const weatherRes = await axios.get(weatherUrl);
      const weather = weatherRes.data;
      setWeatherData(weather);

      updateBackground(weather.location.localtime);

      // Local Sensor Fetch
      try {
        const localRes = await axios.get('http://192.168.0.103/current_data')
        setLocalData(localRes.data);
      } catch (localErr) {
        console.warn("Local sensor issue:", localErr);
        
        if (localErr.code === "ECONNABORTED") {
          setLocalData({ warning: "Slow Response" });
        } else {
          setLocalData({ error: "Offline" });
        }
      }

      setLoading(false);

    } catch (err) {
      console.error(err);
      setError("Failed to fetch weather data.");
      setLoading(false);
    }
  };

  const updateBackground = (localtimeString) => {
    const hour = parseInt(localtimeString.split(' ')[1].split(':')[0], 10);

    if (hour >= 5 && hour < 12) {
      setBgImage(backgroundImages.morning);
      setTimeOfDay("Good Morning");
    } else if (hour >= 12 && hour < 17) {
      setBgImage(backgroundImages.afternoon);
      setTimeOfDay("Good Afternoon");
    } else if (hour >= 17 && hour < 20) {
      setBgImage(backgroundImages.evening);
      setTimeOfDay("Good Evening");
    } else {
      setBgImage(backgroundImages.night);
      setTimeOfDay("Good Night");
    }
  };

  return (
    <div className="app-container" style={{ backgroundImage: `url(${bgImage})` }}>
      
      {loading && <div className="loading-msg">Loading Weather Data...</div>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && !error && weatherData && (
        <div className="glass-card">
          
          {/* Header */}
          <div className="card-header">
            <h3>{timeOfDay}</h3>
            <h2>{weatherData.location.name}, {weatherData.location.country}</h2>
            <p>{weatherData.current.condition.text}</p>
          </div>

          {/* Content */}
          <div className="weather-content">
            
            {/* Internet Weather */}
            <div className="data-column">
              <h4>Outdoors</h4>
              <img src={weatherData.current.condition.icon} alt="weather-icon" />
              <div className="temp-display">{weatherData.current.temp_c}°C</div>
              <div className="details">
                <p>💧 {weatherData.current.humidity}% Humidity</p>
                <p>💨 {weatherData.current.wind_kph} km/h Wind</p>
              </div>
            </div>

            <div className="divider"></div>

            {/* Local Sensor */}
            <div className="data-column">
              <h4>Indoors (Local)</h4>
              <div style={{ fontSize: '64px', margin: '10px 0' }}>🏠</div>

              {localData && !localData.error && !localData.warning ? (
                <>
                  <div className="temp-display">{localData.temperature || "--"}°C</div>
                  <div className="details">
                    <p>💧 {localData.humidity || "--"}% Humidity</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>IP: 192.168.0.103</p>
                  </div>
                </>
              ) : localData?.warning ? (
                <div className="sensor-error">
                  <p>Sensor Slow</p>
                  <small>Waiting for response...</small>
                </div>
              ) : (
                <div className="sensor-error">
                  <p>Sensor Offline</p>
                  <small>Check connection</small>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
