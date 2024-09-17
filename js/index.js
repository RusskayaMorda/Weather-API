const tempUrlRaleigh = 'https://api.open-meteo.com/v1/forecast?latitude=35.7721&longitude=-78.6386&daily=temperature_2m_max,temperature_2m_min';
const rainUrlRaleigh = 'https://api.open-meteo.com/v1/forecast?latitude=35.7721&longitude=-78.6386&daily=precipitation_sum&timezone=auto';


///////////////////////////////////////////////////////////
/////////////////Temperature part//////////////////////////
///////////////////////////////////////////////////////////

fetch(tempUrlRaleigh)
    .then((response) =>{
        if (response.ok){
            return response.json();
        } else {
            throw new Error('Error:', error)
        }
    })
    .then((data) => {
        console.log(data)
        const temperatureSection = document.getElementById('temperature')
        
        const maxTemp = data.daily.temperature_2m_max;
        const minTemp = data.daily.temperature_2m_min;
        const dates = data.daily.time;


        dates.forEach((date, index)=>{
            const tempData = document.createElement('div');
            const max = maxTemp[index];
            const min = minTemp[index];
            const average = (min+max)/2;
            tempData.innerHTML = `Average temp ${date} is ${average.toFixed(1)}`
            temperatureSection.appendChild(tempData)
        })
    })
    .catch((error)=>{
        console.error('Error:', error)
    })

///////////////////////////////////////////////////////////
///////////////////////Rain part///////////////////////////
///////////////////////////////////////////////////////////

    fetch(rainUrlRaleigh)
        .then ((response) => {
            if (response.ok){
                return response.json()
            } else {
                throw Error('Error:', error)
            }
        })
        .then((data)=>{
            console.log(data)
            
            const precipitationSection = document.getElementById('precipitation')
            
        
            const rainData = data.daily.precipitation_sum;

            rainData.forEach((rain, index) => {
                const precipData = document.createElement('div')
                if (rain>0){
                    precipData.innerHTML=(`It will be raining on ${data.daily.time[index]}: ${rain} mm.`)
                } else {
                    precipData.innerHTML=(`No rain on ${data.daily.time[index]}.`)
                }
                precipitationSection.appendChild(precipData)
            })
            
        })