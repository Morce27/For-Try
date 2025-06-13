function updateData() {
  fetch('/data')
    .then(response => response.json())
    .then(data => {
      document.getElementById('mode').innerText = data.autoMode ? 'Automatic' : 'Manual';
      document.getElementById('pump1').innerText = data.pump ? 'ON' : 'OFF';
      document.getElementById('pump2').innerText = data.pump2 ? 'ON' : 'OFF';
      document.getElementById('waterTankLevel').innerText = data.waterTankLevel + '%';
      document.getElementById('fertTankLevel').innerText = data.fertTankLevel + '%';
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

setInterval(updateData, 1000); // Update every second
