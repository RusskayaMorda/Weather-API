let latitude = 35.7721;
let longitude = -78.6386;

let tempData = {};
let rainData = {};

const baseUrl = 'https://api.open-meteo.com/v1/forecast';
let tempUrl = generateUrl('daily=temperature_2m_max,temperature_2m_min');
let rainUrl = generateUrl('daily=precipitation_sum&timezone=auto');
let hourlyForecastUrl = generateUrl('hourly=temperature_2m&timezone=auto');

function generateUrl(params) {
    return `${baseUrl}?latitude=${latitude}&longitude=${longitude}&${params}`;
}

function updateUrls() {
    tempUrl = generateUrl('daily=temperature_2m_max,temperature_2m_min');//tempUrlRaleigh -> tempUrlSearch
    rainUrl = generateUrl('daily=precipitation_sum&timezone=auto');//rainUrlRaleigh -> rainUrlSearch
    hourlyForecastUrl = generateUrl('hourly=temperature_2m&timezone=auto');
}

document.getElementById('searchCity').addEventListener('click', async () => {
    const cityName = document.getElementById('cityName').value.trim();
    hourlyForecastSection.hidden = true;

    if (!cityName) {
        alert('Please enter a city name.');
        return;
    }

    try {
        const cityCoordinates = await fetchCityCoordinates(cityName);
        if (cityCoordinates) {
            latitude = cityCoordinates.latitude;
            longitude = cityCoordinates.longitude;

            document.getElementById('cityName').value = '';

            document.getElementById('currentCity').innerText = `Current city: ${cityCoordinates.name}`;

            updateUrls();

            await fetchDataAndUpdate();
        } else {
            alert('City not found. Please try another city.');
        }
    } catch (error) {
        console.error('Error fetching city coordinates:', error);
        alert('City not found. Please try another city.');
    }
});

async function fetchCityCoordinates(cityName) {
    const citySearchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&format=json`;
    const response = await fetch(citySearchUrl);
    if (response.ok) {
        const data = await response.json();
        if (data.results.length > 0) {
            console.log(data.results[0])
            return data.results[0];
        }
    }
    throw new Error('City not found');
}

async function fetchDataAndUpdate() {
    try {
        [tempData, rainData] = await Promise.all([fetchWeatherData(tempUrl), fetchWeatherData(rainUrl)]);
        checkDataReady();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function fetchWeatherData(url) {
    const response = await fetch(url);
    if (response.ok) {
        return await response.json();
    }
    throw new Error('API request failed');
}

function checkDataReady() {
    if (tempData.daily && tempData.daily.temperature_2m_max && rainData.daily && rainData.daily.precipitation_sum) {
        const forecastCards = document.getElementById('forecastCards');
        forecastCards.innerHTML = '';

        tempData.daily.time.forEach((date, index) => {
            const dayBlock = createDayBlock(date, index);
            forecastCards.appendChild(dayBlock);
        });
    }
}

function createDayBlock(date, index) {
    const dayBlock = document.createElement('div');
    dayBlock.classList.add('dayBlock');

    const forecastDate = document.createElement('h2');
    forecastDate.classList.add('forecastDate');
    forecastDate.innerText = `Date: ${date}`;

    const temperature = document.createElement('p');
    temperature.classList.add('temperature');
    const max = tempData.daily.temperature_2m_max[index];
    const min = tempData.daily.temperature_2m_min[index];
    temperature.innerText = `Temp: ${max}°C | ${min}°C`;

    const rain = document.createElement('p');
    rain.classList.add('rain');
    rain.innerText = rainData.daily.precipitation_sum[index] > 0 ? `Rain: ${rainData.daily.precipitation_sum[index]} mm` : 'No rain';

    dayBlock.appendChild(forecastDate);
    dayBlock.appendChild(temperature);
    dayBlock.appendChild(rain);

    dayBlock.addEventListener('click', () => {
        console.log(`Clicked on date: ${date}`);

        const hourlyHeading = document.querySelector('#hourlyForecastSection h1');
        hourlyHeading.innerText = `Hourly forecast for: ${date}`;

        const hourlySection = document.getElementById('hourlyForecastSection');
        hourlySection.hidden = false;

        fetchHourlyForecast(date);

        document.getElementById('hourlyForecastSection').scrollIntoView({ behavior: 'smooth' });
        setTimeout(function() {
            window.scrollBy({
                top: window.innerHeight / 2,
                behavior: 'smooth'
            });
        }, 400);
    });

    return dayBlock;
}

window.addEventListener('load', fetchDataAndUpdate);

async function fetchHourlyForecast(date) {
    const start = `${date}T00:00:00Z`;
    const end = `${date}T23:59:59Z`;
    const hourlyUrl = `${hourlyForecastUrl}&start=${start}&end=${end}`;

    try {
        const data = await fetchWeatherData(hourlyUrl);
        const selectedDate = new Date(date).toISOString().split('T')[0];

        const filteredData = data.hourly.time.map((time, index) => ({
            time, temperature: data.hourly.temperature_2m[index]
        })).filter(entry => entry.time.startsWith(selectedDate));

        displayHourlyForecast(filteredData);
    } catch (error) {
        console.error('Error fetching hourly forecast:', error);
    }
}

function displayHourlyForecast(hourlyData) {
    const hourlyForecastContainer = document.getElementById('hourlyForecast');
    hourlyForecastContainer.innerHTML = '';

    const morningBlock = createTimeBlock('Morning');
    const afternoonBlock = createTimeBlock('Afternoon');
    const eveningBlock = createTimeBlock('Evening');
    const nightBlock = createTimeBlock('Night');

    hourlyData.forEach((entry) => {
        const hour = new Date(entry.time).getHours();
        const hourFormatted = hour.toString().padStart(2, '0');
        const temperature = entry.temperature;

        const hourBlock = document.createElement('div');
        hourBlock.classList.add('hourlyData');
        hourBlock.innerText = `${hourFormatted}:00 - ${temperature}°C`;

        if (hour >= 5 && hour < 11) {
            morningBlock.appendChild(hourBlock);
        } else if (hour >= 11 && hour < 17) {
            afternoonBlock.appendChild(hourBlock);
        } else if (hour >= 17 && hour < 23) {
            eveningBlock.appendChild(hourBlock);
        } else {
            nightBlock.appendChild(hourBlock);
        }
    });

    hourlyForecastContainer.appendChild(morningBlock);
    hourlyForecastContainer.appendChild(afternoonBlock);
    hourlyForecastContainer.appendChild(eveningBlock);
    hourlyForecastContainer.appendChild(nightBlock);
}

function createTimeBlock(title) {
    const block = document.createElement('div');
    block.classList.add(`${title.toLowerCase()}Block`);
    block.innerHTML = `<h2>${title}</h2>`;
    return block;
}
