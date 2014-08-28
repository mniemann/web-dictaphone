// initialize the whole database system
var db;
var dbName = "vmemos";
var dbVersion = 1;

var request = indexedDB.open(dbName, dbVersion);

request.onerror = function (event) {
  console.log("Database didn't open.", event);
};
request.onsuccess = function (event) {
  console.log("Database opened.");
  db = event.target.result;
};

request.onupgradeneeded = function (event) {

  console.log("Running onupgradeneeded");

  var db = event.target.result;

  if (!db.objectStoreNames.contains("vmemos")) {
    console.log("Creating objectStore for memos");

    var objectStore = db.createObjectStore("vmemos", {keyPath: "id", autoIncrement: true });
    objectStore.createIndex("title", "title", {unique: false});
    objectStore.createIndex("date", "date", {unique: false});
    objectStore.createIndex("audio", "audio", {unique: false});

    console.log("objectstore is ready");
  }
};

function AudioMemo() {
  this.title = "untitled audio memo";
  this.date = new Date();
  this.audio = "";
}
