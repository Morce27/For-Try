// ========== API KEY ==========

const apiKey = '1eff498f76cc7e7e31c7151e71ce64e1'; // OpenWeatherMap API Key

// ========== DOM ELEMENTS ==========

// Sections
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');
const weatherInfoSection = document.querySelector('.weather-info');

// Current Weather Info
const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value');
const windValueTxt = document.querySelector('.wind-value');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');

// Forecast
const forecastItemsContainer = document.querySelector('.forecast-item-container');

// ESP32 Elements
const modeTxt = document.getElementById('mode');
const pump1Txt = document.getElementById('pump1');
const pump2Txt = document.getElementById('pump2');
const waterTankLevelTxt = document.getElementById('waterTankLevel');
const fertTankLevelTxt = document.getElementById('fertTankLevel');
const moistureLevelTxt = document.getElementById('moistureLevel');

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.querySelector('.city-input');
    const searchBtn = document.querySelector('.search-btn');

    searchBtn.addEventListener('click', () => {
        if (cityInput.value.trim() !== '') {
            UpdateWeatherInfo(cityInput.value);
            cityInput.value = '';
            cityInput.blur();
        }
    });

    cityInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && cityInput.value.trim() !== '') {
            UpdateWeatherInfo(cityInput.value);
            cityInput.value = '';
            cityInput.blur();
        }
    });

    // Start ESP32 data updates
    fetchESP32Data();
    setInterval(fetchESP32Data, 1000); // Update every second
});

// ========== FETCH UTILITIES ==========

async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);
    return response.json();
}

// ========== HELPER FUNCTIONS ==========

function getWeatherIcon(id) {
    if (id >= 200 && id <= 232) return 'thunderstorm.svg';
    if (id >= 300 && id <= 321) return 'drizzle.svg';
    if (id >= 500 && id <= 531) return 'rain.svg';
    if (id >= 600 && id <= 622) return 'snow.svg';
    if (id >= 701 && id <= 781) return 'atmosphere.svg';
    if (id === 800) return 'clear.svg';
    return 'clouds.svg';
}

function getCurrentDate() {
    const currentDate = new Date();
    const options = { weekday: 'short', day: '2-digit', month: 'short' };
    return currentDate.toLocaleDateString('en-GB', options);
}

function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection].forEach(sec => sec.style.display = 'none');
    section.style.display = 'flex';
}

// ========== WEATHER UPDATE ==========

async function UpdateWeatherInfo(city) {
    const weatherData = await getFetchData('weather', city);

    if (weatherData.cod != 200) {
        showDisplaySection(notFoundSection);
        return;
    }

    const {
        name: country,
        main: { temp, humidity },
        weather: [{ id, main }],
        wind: { speed }
    } = weatherData;

    countryTxt.textContent = country;
    tempTxt.textContent = Math.round(temp * 10) / 10 + ' °C';
    conditionTxt.textContent = main;
    humidityValueTxt.textContent = humidity + '%';
    windValueTxt.textContent = speed + ' M/s';
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;
    currentDateTxt.textContent = getCurrentDate();

    await updateForecastInfo(city);
    showDisplaySection(weatherInfoSection);
}

// ========== FORECAST ==========

async function updateForecastInfo(city) {
    const forecastsData = await getFetchData('forecast', city);

    const timeTaken = '12:00:00';
    const todayDate = new Date().toISOString().split('T')[0];
    forecastItemsContainer.innerHTML = '';

    forecastsData.list.forEach(forecastWeather => {
        if (
            forecastWeather.dt_txt.includes(timeTaken) &&
            !forecastWeather.dt_txt.includes(todayDate)
        ) {
            updateForecastItems(forecastWeather);
        }
    });
}

function updateForecastItems(weatherData) {
    const {
        dt_txt: date,
        weather: [{ id }],
        main: { temp }
    } = weatherData;

    const dataTaken = new Date(date);
    const dateResult = dataTaken.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="assets/weather/${getWeatherIcon(id)}" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
        </div>
    `;

    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
}

// ========== ESP32 DATA HANDLING ==========

async function fetchESP32Data() {
    try {
        const response = await fetch('/sensorData'); // adjust to `/data` if using different backend
        const data = await response.json();

        modeTxt.innerText = data.mode === 'Auto' || data.autoMode ? 'Automatic' : 'Manual';
        pump1Txt.innerText = data.pump || data.pump1 === 'ON' || data.pump1 === true ? 'ON' : 'OFF';
        pump2Txt.innerText = data.pump2 === 'ON' || data.pump2 === true ? 'ON' : 'OFF';
        waterTankLevelTxt.innerText = (data.waterTankLevel || 0) + '%';
        fertTankLevelTxt.innerText = (data.fertTankLevel || 0) + '%';
        if (moistureLevelTxt) {
            moistureLevelTxt.innerText = (data.moistureLevel || 0) + '%';
        }

        // Auto mode logic (optional)
        if (data.mode === 'Auto' || data.autoMode) {
            const moisture = parseInt(data.moistureLevel);
            if (moisture < 30 && data.pump1 !== 'ON') {
                await fetch('/togglePump');
            } else if (moisture >= 30 && data.pump1 === 'ON') {
                await fetch('/togglePump');
            }
        }

    } catch (error) {
        console.error('Error fetching ESP32 data:', error);
    }
}
