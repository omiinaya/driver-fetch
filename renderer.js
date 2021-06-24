const electron = require('electron')
const ipc = electron.ipcRenderer

//on DOM load
document.addEventListener("DOMContentLoaded", function (event) {
  //setHTML()
  ipc.send('DEFAULT_REQUEST')
});

function start() {
  ipc.send("TESTING_1")
}

function setHTML(a, b, c) {
  var motherboard   = document.getElementById('motherboard').value = a
  var manufacturers = document.getElementById('manufacturers').value = b
  var processors    = document.getElementById('processors').value = c
  console.log(motherboard)
  console.log(manufacturers)
  console.log(processors)
}

ipc.on('LOG_REQUEST', (evt, data) => {
  console.log(data)
});

ipc.on('DEFAULT_RESPONSE', (evt, data) => {
  console.log(data)
  var motherboard = data[0]
  var manufacturer = data[1]
  var cpu = data[2]
  setHTML(motherboard, manufacturer, cpu)
})