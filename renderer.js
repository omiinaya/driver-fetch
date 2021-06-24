const electron = require('electron')
const ipc = electron.ipcRenderer
const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');
const ProgressBar = require('progressbar.js')

var bars = [];

//on DOM load
document.addEventListener("DOMContentLoaded", function (event) {
  console.log(width + " : " + height)
});

function start() {
  ipc.send("TESTING_1")
}

function closeNotification() {
  notification.classList.add('hidden');
}
function restartApp() {
  ipc.send('restart_app');
}

ipc.on('update_available', () => {
  ipc.removeAllListeners('update_available');
  message.innerText = 'A new update is available. Downloading now...';
  notification.classList.remove('hidden');
});

ipc.on('update_downloaded', () => {
  ipc.removeAllListeners('update_downloaded');
  message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
  restartButton.classList.remove('hidden');
  notification.classList.remove('hidden');
});

ipc.on('LOG_REQUEST', (evt, data) => {
  console.log(data)
});

function resizeWindow() {
  var dimensions = [
    getDocumentWidth(),
    getDocumentHeight()
  ]
  ipc.send('RESIZE_REQUEST', dimensions);
}

function createDivs(a) {
  var downloads = document.getElementById('downloads')
  var name = a[1].split('\\')
  const div = document.createElement('div')
  div.innerHTML = `
      <div id="title-` + a[0].size.total + `">` + name[name.length - 1] + `</div>
      <div id="bar-` + a[0].size.total + `"></div>
    `
  downloads.append(div)
  progressBar("bar-" + a[0].size.total, 0)
}

ipc.on('DOWNLOAD_STATUS', (evt, data) => {
  if (!document.getElementById("title-" + data[0].size.total)) {
    createDivs(data)
    resizeWindow()
  } else {
    bars.forEach(bar => {
      bar.animate(1)
    })
  }
});

function getDocumentHeight() {
  var elmHeight = document.defaultView.getComputedStyle(document.getElementById('body'), '').getPropertyValue('height').replace('px', '')
  var elmMargin = parseInt(document.defaultView.getComputedStyle(document.getElementById('body'), '').getPropertyValue('margin-top')) + parseInt(document.defaultView.getComputedStyle(document.getElementById('body'), '').getPropertyValue('margin-bottom'));

  return parseInt(elmHeight) + parseInt(elmMargin) + 70
}

function getDocumentWidth() {
  var elmWidth = document.defaultView.getComputedStyle(document.getElementById('body'), '').getPropertyValue('width').replace('px', '')
  var elmMargin = parseInt(document.defaultView.getComputedStyle(document.getElementById('body'), '').getPropertyValue('margin-left')) + parseInt(document.defaultView.getComputedStyle(document.getElementById('body'), '').getPropertyValue('margin-right'));

  return parseInt(elmWidth) + parseInt(elmMargin) + 40
}

function test() {
  html = document.documentElement;
  console.log('height: ' + getDocumentHeight())
  console.log('width: ' + getDocumentWidth())
  console.log(html.clientHeight)
  console.log(html.clientWidth)
}

function progressBar(id) {
  var bar = new ProgressBar.Line('#' + id, {
    strokeWidth: 4,
    easing: 'easeInOut',
    duration: 1400,
    color: '#FFEA82',
    trailColor: '#eee',
    trailWidth: 1,
    svgStyle: { width: '100%', height: '100%' }
  });
  bars.push(bar)
  bar.animate(0);
}