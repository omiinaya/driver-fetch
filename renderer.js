const electron = require('electron')
const ipc = electron.ipcRenderer

//on DOM load
document.addEventListener("DOMContentLoaded", function (event) {
  getVideoSources()
});

function test1() {
  ipc.send("TESTING_1")
}