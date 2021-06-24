const electron = require('electron')
const ipc = electron.ipcRenderer
const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');
const delay = ms => new Promise(res => setTimeout(res, ms))

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

function createDivs(a) {
  var downloads = document.getElementById('downloads')
  const div = document.createElement('div')
  div.innerHTML = `<div id=` + a.size.total + `>test</div>`
  downloads.append(div)
  //delay(2000)
  resizeWindow()
}

function resizeWindow() {
  var dimensions = [
    getDocumentWidth(), 
    getDocumentHeight()
  ]
  ipc.send('RESIZE_REQUEST', dimensions);
}

ipc.on('DOWNLOAD_STATUS', (evt, data) => {
  if (!document.getElementById(data.size.total)) {
    createDivs(data)
  }
});

function getDocumentHeight() {
  var elmHeight = document.defaultView.getComputedStyle(document.getElementById('body'), '').getPropertyValue('height').replace('px', '')
  var elmMargin = parseInt(document.defaultView.getComputedStyle(document.getElementById('body'), '').getPropertyValue('margin-top')) + parseInt(document.defaultView.getComputedStyle(document.getElementById('body'), '').getPropertyValue('margin-bottom'));
  
  return parseInt(elmHeight) + parseInt(elmMargin) + 60
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

function test2() {
  resizeWindow()
}