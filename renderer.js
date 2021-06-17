const electron = require('electron')
const ipc = electron.ipcRenderer

//on DOM load
document.addEventListener("DOMContentLoaded", function (event) {
  //
});

function start() {
  ipc.send("TESTING_1")
}