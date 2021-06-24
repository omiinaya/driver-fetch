const electron = require('electron')
const ipc = electron.ipcRenderer

var motherboard;
var manufacturers;
var processors;

//on DOM load
document.addEventListener("DOMContentLoaded", function (event) {
  motherboard = document.getElementById('motherboard')
  manufacturers = document.getElementById('manufacturers')
  processors = document.getElementById('processors')


  handleCheckbox()
  ipc.send('DEFAULT_REQUEST')
});

function start() {
  if (!motherboard.value) {
    ipc.send("TESTING_1")
  } else {
    var a = motherboard.value
    var b = manufacturers.value
    var c = processors.value
    ipc.send('MANUAL_REQUEST', [a, b, c])
    ipc.send("START_REQUEST")
  }
}

function handleCheckbox() {
  var checkbox = document.querySelector("input[name=checkbox]");
  checkbox.addEventListener('change', function () {
    if (this.checked) {
      motherboard.disabled = false;
      manufacturers.disabled = false;
      processors.disabled = false;
    } else {
      motherboard.disabled = true;
      manufacturers.disabled = true;
      processors.disabled = true;
      motherboard.value = ''
      ipc.send('RESET_REQUEST')
    }
  });
}

function setHTML(a, b, c) {
  var mb = motherboard.value = a
  var mf = manufacturers.value = b
  var pr = processors.value = c
  console.log(mb)
  console.log(mf)
  console.log(pr)
}

ipc.on('LOG_REQUEST', (evt, data) => {
  console.log(data)
});

ipc.on('HTML_RESPONSE', (evt, data) => {
  var motherboard = data[0]
  var manufacturer = data[1]
  var cpu = data[2]
  setHTML(motherboard, manufacturer, cpu)
})