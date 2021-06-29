const electron = require('electron')
const ipc = electron.ipcRenderer
const ProgressBar = require('progressbar.js')

var motherboard, manufacturers, processors, pBar

//on DOM load
document.addEventListener("DOMContentLoaded", function (event) {
  motherboard = document.getElementById('motherboard')
  manufacturers = document.getElementById('manufacturers')
  processors = document.getElementById('processors')

  handleCheckbox()
  ipc.send('DEFAULT_REQUEST')
});

function start() {
  if (motherboard.value) {
    var a = motherboard.value
    var b = manufacturers.value
    var c = processors.value
    ipc.send('MANUAL_REQUEST', [a, b, c])
    ipc.send("START_REQUEST")
  }
}

function update() {
  ipc.send("UPDATE_REQUEST")
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
      ipc.send("DEFAULT_REQUEST")
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

ipc.on('PROGRESS_REQUEST', () => {
  progressBar('progressBar')
})

ipc.on('STATUS_FETCHING', () => {
  var status = document.getElementById('status')
  status.innerHTML = "<div>Fetching Drivers...</div>"
})

ipc.on('STATUS_DOWNLOADING', () => {
  var status = document.getElementById('status')
  status.innerHTML = "<div>Downloading Drivers...</div>"
})

ipc.on('STATUS_EXTRACTING', () => {
  var status = document.getElementById('status')
  status.innerHTML = "<div>Extracting Drivers...</div>"
})

ipc.on('UPDATE_BAR', (evt, data) => {
  console.log(data)
  var a = data.file_count
  var b = data.file_total
  animateBar(a, b)
  if (a === b) {
    setDone()
  }
})

function setDone() {
  var status = document.getElementById('status')
  status.innerHTML = "<div>Done.</div>"
  ipc.send("OPEN_DIRECTORY")
}

function progressBar() {
  var bar = new ProgressBar.Line('#progressBar', {
    strokeWidth: 4,
    easing: 'easeInOut',
    duration: 1400,
    color: '#1b75be',
    trailColor: '#eee',
    trailWidth: 1,
    svgStyle: { width: '100%', height: '100%' }
  });
  pBar = bar
}

function animateBar(a, b) {
  var x = a / b
  pBar.animate(x);
}