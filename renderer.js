const { ipcRenderer } = require("electron");
let musicData;
let currentSongIndex = 0;
let intervalId;
let isLoopMode = false;
let dirsLocations;

const musicList = document.querySelector(".music-list");
const music = document.querySelector(".music-src");
const playBtn = document.querySelector(".play-btn");
const skipPreviousBtn = document.querySelector(".skip-previous-btn");
const skipNextBtn = document.querySelector(".skip-next-btn");
const muteBtn = document.querySelector(".mute-btn");
const songTitleContainer = document.querySelector(".song-title-container");
const currentTime = document.querySelector(".current-time");
const durationTime = document.querySelector(".duration-time");
const track = document.querySelector(".track");
const toggleLoopModeBtn = document.querySelector(".toggleLoopMode");
const addBtn = document.querySelector(".add-btn");
const locationContainer = document.querySelector(".location");
const deleteLocationBtn = document.querySelector(".delete-btn");
const folders = document.querySelector(".folders");
const pageTitle = document.querySelector("title");

const iconsHTML = {
  play: '<span class="material-symbols-outlined"> play_arrow </span>',
  pause: '<span class="material-symbols-outlined"> pause </span>',
  volumeUp: '<span class="material-symbols-outlined"> volume_up </span>',
  volumeOf: '<span class="material-symbols-outlined">volume_off</span>',
};

// startup function
function populateMusicList(musicFiles) {
  const htmlString = musicFiles.map(
    (file, i) => `<div class="music-list-element ${
      i === currentSongIndex ? "active-music-list-element" : ""
    }" id="${file.title}">
                  <img src="${file.img}" />
                  <p class="title" >${file.title}</p>
                </div>`
  );
  musicList.innerHTML = "";
  musicList.insertAdjacentHTML("afterbegin", htmlString.join(" "));
}

function init() {
  if (track) {
    ipcRenderer.send("get-music-files");
  } else {
  }
}
init();

// event listeners
ipcRenderer.on("get-music-files", (event, musicFilesData) => {
  populateMusicList(musicFilesData);
  musicData = musicFilesData;
  loadMusic(musicData[currentSongIndex], (state = "pause"));
});

function pushHTML(container, htmlString) {
  container.innerHTML = "";
  container.insertAdjacentHTML("afterbegin", htmlString);
}

function loadMusic(song, state = "play") {
  music.src = song.file;
  if (state === "play") music.play();
  else if (state === "pause") music.pause();

  pushHTML(
    songTitleContainer,
    `<img
        src="${song.img}"
        class="song-img"
        alt=""
      />

      <marquee><div class="song-title">${song.title}</div></marquee>`
  );

  populateMusicList(musicData);
  pageTitle.textContent = `Orbit - ${song.title}`;
}

if (musicList)
  musicList.addEventListener("click", (event) => {
    const musicId = event.target.id || event.target.parentElement.id;
    if (musicId) {
      const songToLoad = musicData.find((song) => song.title === musicId);
      if (songToLoad) {
        currentSongIndex = musicData.indexOf(songToLoad);
        loadMusic(songToLoad);
      }
    }
  });

if (music) {
  // audio actions
  music.addEventListener("play", function () {
    pushHTML(playBtn, iconsHTML.pause);
    // Start running the whilePlaying function continuously
    intervalId = setInterval(function () {
      currentTime.innerHTML = formatTime(music.currentTime);
      const musicCompletePrecentile = Math.round(
        (music.currentTime / music.duration) * 100
      );

      track.value = musicCompletePrecentile;
      track.style.background = `linear-gradient(
        to right,
        var(--primary),
        var(--mid-primary) ${musicCompletePrecentile}%,
        #ffffff 20%,
        #ffffff
      )`;
    }, 500);
  });

  music.addEventListener("ended", function () {
    if (isLoopMode) {
      loadMusic(musicData[currentSongIndex], "play");
    } else {
      currentSongIndex += 1;
      loadMusic(musicData[currentSongIndex]);
    }
  });

  music.addEventListener("pause", function () {
    pushHTML(playBtn, iconsHTML.play);
    clearInterval(intervalId);
  });

  music.addEventListener("volumechange", function () {
    if (music.muted) {
      pushHTML(muteBtn, iconsHTML.volumeOf);
    } else {
      pushHTML(muteBtn, iconsHTML.volumeUp);
    }
  });

  music.addEventListener("loadeddata", function () {
    durationTime.textContent = formatTime(music.duration);
  });
}

// audio controls

if (playBtn) {
  playBtn.addEventListener("click", function () {
    music.paused ? music.play() : music.pause();
  });
}
if (track) {
  track.addEventListener("input", function (event) {
    const trackTime = (event.target.value / 100) * music.duration;
    music.currentTime = trackTime;
  });
}

function loadPreviousSong() {
  if (currentSongIndex > 0) {
    currentSongIndex -= 1;
    loadMusic(musicData[currentSongIndex]);
  } else {
    currentSongIndex = musicData.length - 1;
    loadMusic(musicData[currentSongIndex]);
  }
}

if (skipPreviousBtn) {
  skipPreviousBtn.addEventListener("click", function () {
    if (music.currentTime < 5) {
      loadPreviousSong();
    } else {
      music.currentTime = 0;
    }
  });
}

if (skipNextBtn)
  skipNextBtn.addEventListener("click", function () {
    if (currentSongIndex < musicData.length - 1) {
      currentSongIndex += 1;
      loadMusic(musicData[currentSongIndex]);
    } else {
      currentSongIndex = 0;
      loadMusic(musicData[currentSongIndex]);
    }
  });

if (muteBtn) {
  muteBtn.addEventListener("click", function () {
    if (music.muted) {
      music.muted = false;
    } else {
      music.muted = true;
    }
  });
}

if (toggleLoopModeBtn) {
  toggleLoopModeBtn.addEventListener("click", function () {
    isLoopMode = !isLoopMode;
    toggleLoopModeBtn.classList.toggle("active-toggle-mode");
  });
}
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedMinutes = String(minutes).padStart(2, "0"); // Ensures two digits
  const formattedSeconds = String(remainingSeconds).padStart(2, "0"); // Ensures two digits
  const formatedTime = `${formattedMinutes}:${formattedSeconds}`.split(".")[0];

  if (!(`${formatedTime.split(":")[1]}`.length < 2)) {
    return formatedTime;
  } else {
    const timeSplit = formatedTime.split(":").join(":0");
    return timeSplit;
  }
}

// muisi folder logic
if (locationContainer) {
  ipcRenderer.send("get-music-dirs");
}

ipcRenderer.on("get-music-dirs", function (event, locations) {
  dirsLocations = locations;
  const htmlString = locations.map(
    (location) =>
      `<button class="container delete-btn" id="${location}">${location}</button>`
  );

  pushHTML(locationContainer, htmlString.join(" "));
});

if (folders) {
  folders.addEventListener("click", function (event) {
    const id = event.target.id;
    if (id && id !== "addBtn") {
      ipcRenderer.send("delete-location", id);
    } else if (id === "addBtn") {
      ipcRenderer.send("add-new-location");
    }
  });
}

ipcRenderer.on("location-deleted", function () {
  ipcRenderer.send("get-music-dirs");
});

ipcRenderer.on("location-added", (event, newLocation) => {
  dirsLocations.push(newLocation);
  const htmlString = dirsLocations.map(
    (location) =>
      `<button class="container delete-btn" id="${location}">${location}</button>`
  );

  pushHTML(locationContainer, htmlString.join(" "));
});

// if (addBtn) {
//   addBtn.addEventListener("click", function () {
//     console.log("in");
//   });
// }
