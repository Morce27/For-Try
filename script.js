// API key for OpenWeatherMap
const apiKey = '1eff498f76cc7e7e31c7151e71ce64e1'; 

// Sections for controlling visibility
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');
const weatherInfoSection = document.querySelector('.weather-info');

// Elements to display current weather info
const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value');
const windValueTxt = document.querySelector('.wind-value');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');

// Container for forecast items
const forecastItemsContainer = document.querySelector('.forecast-item-container');


// ========== INITIAL SETUP ==========

document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.querySelector('.city-input');
    const searchBtn = document.querySelector('.search-btn');

    // Search button click event
    searchBtn.addEventListener('click', () => {
        if (cityInput.value.trim() !== '') {
            UpdateWeatherInfo(cityInput.value);
            cityInput.value = '';
            cityInput.blur();
        }
    });

    // Enter key press event on input
    cityInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && cityInput.value.trim() !== '') {
            UpdateWeatherInfo(cityInput.value);
            cityInput.value = '';
            cityInput.blur();
        }
    });
});


// ========== FETCH UTILITIES ==========

// Fetch data from OpenWeatherMap API
async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;

    const response = await fetch(apiUrl);
    return response.json(); // Returns a Promise
}


// ========== HELPER FUNCTIONS ==========

// Get corresponding weather icon filename based on weather ID
function getWeatherIcon(id) {
    if (id >= 200 && id <= 232) return 'thunderstorm.svg';
    if (id >= 300 && id <= 321) return 'drizzle.svg';
    if (id >= 500 && id <= 531) return 'rain.svg';
    if (id >= 600 && id <= 622) return 'snow.svg';
    if (id >= 701 && id <= 781) return 'atmosphere.svg';
    if (id === 800) return 'clear.svg';
    return 'clouds.svg'; // default for clouds (801–804)
}

// Format and return current date
function getCurrentDate() {
    const currentDate = new Date();
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    };
    return currentDate.toLocaleDateString('en-GB', options);
}

// Show only one section (hide others)
function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection].forEach(sec => sec.style.display = 'none');
    section.style.display = 'flex';
}


// ========== WEATHER UPDATING ==========

// Fetch and update current weather info
async function UpdateWeatherInfo(city) {
    const weatherData = await getFetchData('weather', city);

    // If city not found
    if (weatherData.cod != 200) {
        showDisplaySection(notFoundSection);
        return;
    }

    console.log(weatherData); // Debug

    // Destructure necessary weather data
    const {
        name: country,
        main: { temp, humidity },
        weather: [{ id, main }],
        wind: { speed }
    } = weatherData;

    // Populate weather data into DOM
    countryTxt.textContent = country;
    tempTxt.textContent = Math.round(temp * 10) / 10 + ' °C';
    conditionTxt.textContent = main;
    humidityValueTxt.textContent = humidity + '%';
    windValueTxt.textContent = speed + ' M/s';
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;
    currentDateTxt.textContent = getCurrentDate();

    console.log(getCurrentDate()); // Debug

    await updateForecastInfo(city); // Load forecast
    showDisplaySection(weatherInfoSection); // Show main section
}


// ========== FORECAST HANDLING ==========

// Fetch and update forecast info
async function updateForecastInfo(city) {
    const forecastsData = await getFetchData('forecast', city);

    const timeTaken = '12:00:00'; // Choose time snapshot for each day
    const todayDate = new Date().toISOString().split('T')[0];

    forecastItemsContainer.innerHTML = ''; // Clear old forecasts

    // Loop through forecast data
    forecastsData.list.forEach(forecastWeather => {
        if (
            forecastWeather.dt_txt.includes(timeTaken) &&
            !forecastWeather.dt_txt.includes(todayDate)
        ) {
            updateForecastItems(forecastWeather);
        }
    });
}

// Create and insert forecast item into the DOM
function updateForecastItems(weatherData) {
    console.log(weatherData); // Debug

    const {
        dt_txt: date,
        weather: [{ id }],
        main: { temp }
    } = weatherData;

    const dataTaken = new Date(date);
    const dateOption = {
        day: '2-digit',
        month: 'short'
    };

    const dateResult = dataTaken.toLocaleDateString('en-US', dateOption);

    // Create forecast item HTML
    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="assets/weather/${getWeatherIcon(id)}" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
        </div>
    `;

    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
}
async function fetchESP32Data() {
  try {
    const res = await fetch('/data');
    const d = await res.json();

    modeTxt.innerText = d.autoMode ? 'Automatic' : 'Manual';
    pump1Txt.innerText = d.pump ? 'ON' : 'OFF';
    pump2Txt.innerText = d.pump2 ? 'ON' : 'OFF';
    waterTankLevelTxt.innerText = `${d.waterTankLevel}%`;
    fertTankLevelTxt.innerText = `${d.fertTankLevel}%`;
    moistureLevelTxt.innerText = `${d.moisture}%`;
  } catch (e) {
    console.error('ESP32 fetch error:', e);
  }
}

setInterval(updateData, 1000); // Update every second
