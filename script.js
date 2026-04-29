// Locarno coordinates
const LATITUDE = 46.1703;
const LONGITUDE = 8.7881;
const API_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO Weather Code to description mapping
const weatherCodes = {
    0: '☀️ Dégagé',
    1: '🌤️ Surtout dégagé',
    2: '⛅ Partiellement nuageux',
    3: '☁️ Nuageux',
    45: '🌫️ Brumeux',
    48: '🌫️ Brumeux',
    51: '🌧️ Légère bruine',
    53: '🌧️ Bruine modérée',
    55: '🌧️ Bruine importante',
    61: '🌧️ Légère pluie',
    63: '🌧️ Pluie modérée',
    65: '🌧️ Pluie importante',
    71: '❄️ Légère neige',
    73: '❄️ Neige modérée',
    75: '❄️ Neige importante',
    77: '❄️ Grains de neige',
    80: '🌧️ Légères averses',
    81: '🌧️ Averses modérées',
    82: '🌧️ Violentes averses',
    85: '❄️ Légères averses de neige',
    86: '❄️ Importantes averses de neige',
    95: '⛈️ Orage',
    96: '⛈️ Orage avec grêle',
    99: '⛈️ Orage avec grêle'
};

function getWeatherDescription(code) {
    return weatherCodes[code] || '🌡️ Inconnu';
}

async function fetchWeather() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const currentEl = document.getElementById('current-weather');
    const hourlyEl = document.getElementById('hourly-forecast');

    try {
        // Show loading state
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';

        const params = new URLSearchParams({
            latitude: LATITUDE,
            longitude: LONGITUDE,
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
            hourly: 'temperature_2m,precipitation_probability',
            daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
            timezone: 'auto'
        });

        const response = await fetch(`${API_URL}?${params}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Display current weather
        const current = data.current;
        const temp = current.temperature_2m;
        const humidity = current.relative_humidity_2m;
        const wind = current.wind_speed_10m;
        const windKmh = (wind * 3.6).toFixed(1); // Convert m/s to km/h
        const weatherDesc = getWeatherDescription(current.weather_code);

        currentEl.innerHTML = `
      <div class="current-main">
        <div class="weather-icon">${weatherDesc.split(' ')[0]}</div>
        <div class="current-info">
          <div class="location">Locarno, Suisse</div>
          <div class="temperature">${temp}°C</div>
          <div class="description">${weatherDesc.substring(2)}</div>
        </div>
      </div>
      <div class="current-details">
        <div class="detail">
          <span class="label">Humidité :</span>
          <span class="value">${humidity}%</span>
        </div>
        <div class="detail">
          <span class="label">Vent :</span>
          <span class="value">${windKmh} km/h</span>
        </div>
      </div>
    `;

        // Display hourly forecast
        const hourly = data.hourly;
        const times = hourly.time;
        const temps = hourly.temperature_2m;
        const precipProb = hourly.precipitation_probability;

        // Prepare hourly chart data (first 24 hours, every 2 hours)
        const hourlySlice = times.slice(0, 24).filter((_, index) => index % 2 === 0);
        const hourlyLabels = hourlySlice.map(t => {
            const time = new Date(t);
            return time.getHours().toString().padStart(2, '0') + ':00';
        });
        const hourlyTemps = temps.slice(0, 24).filter((_, index) => index % 2 === 0);
        const hourlyPrecip = precipProb.slice(0, 24).filter((_, index) => index % 2 === 0);

        renderHourlyChart(hourlyLabels, hourlyTemps, hourlyPrecip);

        // Display daily chart
        const daily = data.daily;
        const dailyTimes = daily.time;
        const maxTemps = daily.temperature_2m_max;
        const minTemps = daily.temperature_2m_min;
        const precipitation = daily.precipitation_sum;

        // Prepare chart data (first 7 days)
        const chartDays = dailyTimes.slice(0, 7).map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        const chartMaxTemps = maxTemps.slice(0, 7);
        const chartMinTemps = minTemps.slice(0, 7);
        const chartPrecip = precipitation.slice(0, 7);

        renderChart(chartDays, chartMaxTemps, chartMinTemps, chartPrecip);

        // Hide loading state
        loadingEl.style.display = 'none';

    } catch (error) {
        console.error('Weather fetch failed:', error);
        errorEl.innerHTML = `<p>❌ Impossible de charger les données météo : ${error.message}</p>`;
        errorEl.style.display = 'block';
        loadingEl.style.display = 'none';
        currentEl.innerHTML = '';
        hourlyEl.innerHTML = '';
    }
}

function renderChart(labels, maxTemps, minTemps, precipitation) {
    const ctx = document.getElementById('temperatureChart');

    if (window.tempChart instanceof Chart) {
        window.tempChart.destroy();
    }

    const canvas = ctx.getContext('2d');
    window.tempChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Température max (°C)',
                    data: maxTemps,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#ff6b6b',
                    yAxisID: 'y'
                },
                {
                    label: 'Température min (°C)',
                    data: minTemps,
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#4ecdc4',
                    yAxisID: 'y'
                },
                {
                    label: 'Précipitations (mm)',
                    data: precipitation,
                    borderColor: '#95a5a6',
                    backgroundColor: 'rgba(149, 165, 166, 0.2)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#95a5a6',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        },
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'Prévisions météo 7 jours',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: 15
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Température (°C)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    min: Math.min(...minTemps) - 5,
                    max: Math.max(...maxTemps) + 5
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Probabilité de précipitation (%)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    min: 0,
                    max: Math.max(...precipitation) + 5
                }
            }
        }
    });
}

function renderHourlyChart(labels, temperatures, precipitation) {
    const ctx = document.getElementById('hourlyChart');

    if (window.hourlyChart instanceof Chart) {
        window.hourlyChart.destroy();
    }

    const canvas = ctx.getContext('2d');
    window.hourlyChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Température (°C)',
                    data: temperatures,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#f39c12',
                    yAxisID: 'y'
                },
                {
                    label: 'Probabilité de précipitation (%)',
                    data: precipitation,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.15)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#3498db',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        },
                        usePointStyle: true
                    }
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Heure',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Température (°C)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    min: Math.min(...temperatures) - 2,
                    max: Math.max(...temperatures) + 2
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Probabilité de précipitation (%)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

// Fetch weather when page loads
document.addEventListener('DOMContentLoaded', fetchWeather);
