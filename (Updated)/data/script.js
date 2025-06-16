const apiKey = '1eff498f76cc7e7e31c7151e71ce64e1';

// DOM references
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');
const weatherInfoSection = document.querySelector('.weather-info');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value');
const windValueTxt = document.querySelector('.wind-value');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');
const forecastItemsContainer = document.querySelector('.forecast-item-container');

const modeTxt = document.getElementById('mode');
const pump1Txt = document.getElementById('pump1');
const pump2Txt = document.getElementById('pump2');
const waterTankLevelTxt = document.getElementById('waterTankLevel');
const fertTankLevelTxt = document.getElementById('fertTankLevel');
const moistureLevelTxt = document.getElementById('moistureLevel');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.search-btn').addEventListener('click', onSearch);
  document.querySelector('.city-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') onSearch();
  });
  fetchESP32Data();
  setInterval(fetchESP32Data, 2000);
});

function onSearch() {
  const city = document.querySelector('.city-input').value.trim();
  if (city) UpdateWeatherInfo(city);
}

// Weather fetching
async function getWeather(endpoint, city) {
  const r = await fetch(`https://api.openweathermap.org/data/2.5/${endpoint}?q=${city}&appid=${apiKey}&units=metric`);
  return r.json();
}

async function UpdateWeatherInfo(city) {
  const w = await getWeather('weather', city);
  if (w.cod != 200) {
    showSection(notFoundSection);
    return;
  }

  countryTxt.textContent = w.name;
  tempTxt.textContent = `${Math.round(w.main.temp*10)/10} °C`;
  conditionTxt.textContent = w.weather[0].main;
  humidityValueTxt.textContent = `${w.main.humidity}%`;
  windValueTxt.textContent = `${w.wind.speed} M/s`;
  weatherSummaryImg.src = `assets/weather/${getWeatherIcon(w.weather[0].id)}`;
  currentDateTxt.textContent = formatDate(new Date(), 'en-GB');

  const fc = await getWeather('forecast', city);
  const today = new Date().toISOString().split('T')[0];
  forecastItemsContainer.innerHTML = '';
  fc.list
    .filter(f => f.dt_txt.includes('12:00:00') && !f.dt_txt.startsWith(today))
    .forEach(f => {
      forecastItemsContainer.innerHTML += `
        <div class="forecast-item">
          <h5>${formatDate(f.dt_txt,'en-US')}</h5>
          <img src="assets/weather/${getWeatherIcon(f.weather[0].id)}" class="forecast-item-img">
          <h5>${Math.round(f.main.temp)} °C</h5>
        </div>`;
    });

  showSection(weatherInfoSection);
}

function formatDate(d, locale) {
  return new Date(d).toLocaleDateString(locale, {
    weekday: 'short', day: '2-digit', month: 'short'
  });
}

function getWeatherIcon(id) {
  if (id < 300) return 'thunderstorm.svg';
  if (id < 400) return 'drizzle.svg';
  if (id < 600) return 'rain.svg';
  if (id < 700) return 'snow.svg';
  if (id < 800) return 'atmosphere.svg';
  if (id === 800) return 'clear.svg';
  return 'clouds.svg';
}

function showSection(sec) {
  [weatherInfoSection, searchCitySection, notFoundSection].forEach(s => s.style.display = 'none');
  sec.style.display = 'flex';
}

// ESP32 data fetching
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
