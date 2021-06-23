const electron = require('electron')
const ipc = electron.ipcRenderer
const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

//on DOM load
document.addEventListener("DOMContentLoaded", function (event) {
  //
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