/* initialise variables */

var inputUrl = document.querySelector('.new-bkm input.url');
var inputTitle = document.querySelector('.new-bkm input.title');
var inputBody = document.querySelector('.new-bkm textarea');
var noteContainer = document.querySelector('.note-container');
var addBtn = document.querySelector('.add');

/*  add event listeners to buttons */

addBtn.addEventListener('click', add);

/* generic error handler */
function onError(error) {
  console.log(error);
}

initialize();

function setInfo(tabs) {
  var tab = tabs[0]
  inputUrl.value = tab.url
  inputTitle.value = tab.title
}

function initialize() {
  browser.tabs.query({ active: true, currentWindow: true }, setInfo);
}

function add() {
  
}
