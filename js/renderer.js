// Imports
const {remote, ipcRenderer} = require("electron");
const $ = require("jquery");
window.jQuery = $;
const Swal = require("sweetalert2");
const randomColor = require("randomcolor");
const chroma = require("chroma-js");
const velocity = require("velocity-animate");
const logger = remote.getGlobal("rendererLogger");
const config = remote.getGlobal("config");

// Inform that Renderer started
logger.info("Renderer started ...");

// Create variables
var assets = remote.getGlobal("assets");
var container = document.getElementById("container");
var isPaused = false;
var currentAssetIndex = assets.length;
var startTime, endTime, longpress, timeout, recordSwal, currentChatId, currentMessageId, currentTimeout;

// configure sound notification sound
if (config.playSoundOnRecieve != false) {
  var audio = new Audio(__dirname + "/sound1.mp3");
}

// handle touch events for navigation and voice reply
$("body").on('touchstart', function() {
  startTime = new Date().getTime();
  currentImageForVoiceReply = assets[currentAssetIndex]
});

$("body").on('touchend', function(event) {
  endTime = new Date().getTime();
  longpress = (endTime - startTime > 500) ? true : false;
  tapPos = event.originalEvent.changedTouches[0].pageX
  containerWidth = $("body").width()
  if (tapPos / containerWidth < 0.2) {
    previousAsset()
  } else if (tapPos / containerWidth > 0.8) {
    nextAsset()
  } else {
    if (longpress) {
      ipcRenderer.send("record", currentImageForVoiceReply['chatId'], currentImageForVoiceReply['messageId']);
    } else {
      if (isPaused) {
        play()
      } else {
        pause()
      }
    }
  }
});

// handle pressed record button
ipcRenderer.on("recordButtonPressed", function(event, arg) {
  currentImageForVoiceReply = assets[currentAssetIndex]
  ipcRenderer.send("record", currentImageForVoiceReply['chatId'], currentImageForVoiceReply['messageId']);
});


// show record in progress message
ipcRenderer.on("recordStarted", function(event, arg) {
  let message = document.createElement("div");
  let spinner = document.createElement("div");
  spinner.classList.add("spinner");
  message.appendChild(spinner);
  let text = document.createElement("p");
  messageText = config.voiceReply.recordingPreMessage
                    + ' ' + currentImageForVoiceReply['chatName']
                    + ' ' + config.voiceReply.recordingPostMessage;
  text.innerHTML = messageText
  message.appendChild(text);
  recordSwal = Swal.fire({
    title: config.voiceReply.recordingMessageTitle,
    showConfirmButton: false,
    html: message
  });
});

// show record done message
ipcRenderer.on("recordStopped", function(event, arg) {
  let message = document.createElement("div");
  let text = document.createElement("p");
  text.innerHTML = config.voiceReply.recordingDone
                    + ' ' + currentImageForVoiceReply['chatName'];
  message.appendChild(text);
  recordSwal.close();
  Swal.fire({
    html: message,
    title: config.voiceReply.recordingMessageTitle,
    showConfirmButton: false,
    type: "success",
    timer: 5000
  });
});

//show record error message
ipcRenderer.on("recordError", function(event, arg) {
  let message = document.createElement("div");
  let text = document.createElement("p");
  text.innerHTML = config.voiceReply.recordingError;
  message.appendChild(text);
  recordSwal.close();
  Swal.fire({
    html: message,
    title: config.voiceReply.recordingMessageTitle,
    showConfirmButton: false,
    icon: "error",
    timer: 5000
  });
});

// handle new incoming asset
ipcRenderer.on("newAsset", function(event, arg) {
  newAsset(arg.sender, arg.type);
  if (config.playSoundOnRecieve != false) {
    audio.play();
  }
});

// handle navigation
ipcRenderer.on("next", function(event, arg) {
  nextAsset()
});

ipcRenderer.on("previous", function(event, arg) {
  previousAsset()
});

ipcRenderer.on("pause", function(event, arg) {
  pause()
});

ipcRenderer.on("play", function(event, arg) {
  play()
});

// functions to show and hide pause icon
function showPause() {
  var pauseBox = document.createElement("div");
  var div1 = document.createElement("div");
  var div2 = document.createElement("div");

  pauseBox.id = "pauseBox";
  pauseBox.style =
    "height:50px;width:45px;position:absolute;top:20px;right:20px";

  pauseBox.appendChild(div1);
  pauseBox.appendChild(div2);

  div1.style =
    "height:50px;width:15px;background-color:blue;float:left;border-radius:2px";
  div2.style =
    "height:50px;width:15px;background-color:blue;float:right;border-radius:2px";

  container.appendChild(pauseBox);
}

function hidePause() {
  let node = document.getElementById("pauseBox");
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}

// functions for navigation
function nextAsset() {
  if (isPaused) hidePause();
  loadAsset(true, 0);
  if (isPaused) showPause();
}

function previousAsset() {
  if (isPaused) hidePause();
  loadAsset(false, 0);
  if (isPaused) showPause();
}

function pause() {
  if (isPaused) return;

  isPaused = true;
  clearTimeout(currentTimeout);
  showPause(isPaused);
}

function play() {
  if (!isPaused) return;

  isPaused = false;
  loadAsset(true, 0);
  hidePause(isPaused);
}

function assetIsVideo(asset) {
  return asset.src.split(".").pop() == "mp4"
}

function assetIsImage(asset) {
  return asset.src.split(".").pop() == "jpg"
}

function assetIsText(asset) {
  return asset.src.split(".").pop() == "txt"
}

//load image to slideshow
function loadAsset(isNext, fadeTime, goToLatest = false) {
  clearTimeout(currentTimeout);

  if (assets.length == 0) {
    currentTimeout = setTimeout(() => {
      loadAsset(true, fadeTime);
    }, config.interval);
    return;
  }

  // get image path and increase currentAssetIndex for next image
  if (isNext) {
    if (currentAssetIndex >= assets.length - 1) {
      currentAssetIndex = 0;
    } else {
      currentAssetIndex++;
    }
  } else {
    currentAssetIndex--;
    if (currentAssetIndex < 0) currentAssetIndex = assets.length - 1;
  }

  var asset = assets[currentAssetIndex];

  //get current container and create needed elements
  var currentImage = container.firstElementChild;
  var div = document.createElement("div");
  var assetTag;
  if (assetIsVideo(asset)) {
    assetTag = document.createElement("video");
    assetTag.muted = !config.playVideoAudio;
    assetTag.autoplay = true;
  } else if (assetIsImage(asset)) {
    assetTag = document.createElement("img");
  } else if (assetIsText(asset)) {
    assetTag = document.createElement("embed")
    //assetTag.innerText = "Hello World";
  }
  var sender = document.createElement("span");
  var caption = document.createElement("span");

  //create background and font colors for sender and caption
  var backgroundColor = randomColor({
    luminosity: "dark",
    alpha: 1
  });
  var fontColor = randomColor({
    luminosity: "light",
    alpha: 1
  });
  //when contrast between background color and font color is too small to
  //make the text readable, recreate colors
  while (chroma.contrast(backgroundColor, fontColor) < 4.5) {
    backgroundColor = randomColor({
      luminosity: "dark",
      alpha: 1
    });
    fontColor = randomColor({
      luminosity: "light",
      alpha: 1
    });
  }

  //set class names and style attributes
  assetTag.src = asset.src;
  assetTag.className = "image";
  div.className = "assetcontainer";
  sender.className = "sender";
  caption.className = "caption";
  caption.id = "caption";
  sender.innerHTML = asset.sender;
  caption.innerHTML = asset.caption;
  sender.style.backgroundColor = backgroundColor;
  caption.style.backgroundColor = backgroundColor;
  sender.style.color = fontColor;
  caption.style.color = fontColor;

  //generate some randomness for positions of sender and caption
  if (Math.random() >= 0.5) {
    sender.style.left = 0;
    sender.style.borderTopRightRadius = "10px";
    sender.style.borderBottomRightRadius = "10px";
  } else {
    sender.style.right = 0;
    sender.style.borderTopLeftRadius = "10px";
    sender.style.borderBottomLeftRadius = "10px";
  }
  if (Math.random() >= 0.5) {
    caption.style.left = 0;
    caption.style.borderTopRightRadius = "10px";
    caption.style.borderBottomRightRadius = "10px";
  } else {
    caption.style.right = 0;
    caption.style.borderTopLeftRadius = "10px";
    caption.style.borderBottomLeftRadius = "10px";
  }
  if (Math.random() >= 0.5) {
    sender.style.top = "2%";
    caption.style.bottom = "2%";
  } else {
    sender.style.bottom = "2%";
    caption.style.top = "2%";
  }

  //calculate aspect ratio to show complete image on the screen and
  //fade in new image while fading out the old image as soon as
  //the new imageis loaded
  if (assetIsVideo(asset)) {
    assetTag.onloadeddata = function() {
      screenAspectRatio =
        remote
        .getCurrentWindow()
        .webContents.getOwnerBrowserWindow()
        .getBounds().width /
        remote
        .getCurrentWindow()
        .webContents.getOwnerBrowserWindow()
        .getBounds().height;
      imageAspectRatio = assetTag.naturalWidth / assetTag.naturalHeight;
      if (imageAspectRatio > screenAspectRatio) {
        assetTag.style.width = "100%";
        div.style.width = "100%";
      } else {
        assetTag.style.height = "100%";
        div.style.height = "100%";
      }
      $(div).velocity("fadeIn", {
        duration: fadeTime
      });
      $(currentImage).velocity("fadeOut", {
        duration: fadeTime
      });
      if (!isPaused) {
        currentTimeout = setTimeout(() => {
          loadAsset(true, fadeTime);
        }, assetTag.duration * 1000);
      }
    };
  } else if (assetIsImage(asset)) {
    assetTag.onload = function() {
      screenAspectRatio =
        remote
        .getCurrentWindow()
        .webContents.getOwnerBrowserWindow()
        .getBounds().width /
        remote
        .getCurrentWindow()
        .webContents.getOwnerBrowserWindow()
        .getBounds().height;
      imageAspectRatio = assetTag.naturalWidth / assetTag.naturalHeight;
      if (imageAspectRatio > screenAspectRatio) {
        assetTag.style.width = "100%";
        div.style.width = "100%";
      } else {
        assetTag.style.height = "100%";
        div.style.height = "100%";
      }
      $(div).velocity("fadeIn", {
        duration: fadeTime
      });
      $(currentImage).velocity("fadeOut", {
        duration: fadeTime
      });
      if (!isPaused) {
        currentTimeout = setTimeout(() => {
          loadAsset(true, config.fadeTime);
        }, config.interval);
      }
    };
  } else if (assetIsText(asset)) {
    assetTag.style.width = "100%";
    div.style.width = "100%";
    $(div).velocity("fadeIn", {
      duration: fadeTime
    });
    $(currentImage).velocity("fadeOut", {
      duration: fadeTime
    });
    if (!isPaused) {
      currentTimeout = setTimeout(() => {
        loadAsset(true, config.fadeTime);
      }, config.interval);
    }
  }

  div.appendChild(assetTag);
  if (config.showSender) {
    div.appendChild(sender);
  }
  if (config.showCaption && asset.caption !== undefined) {
    div.appendChild(caption);
  }
  setTimeout(function() {
    container.removeChild(currentImage);
  }, fadeTime)

  container.appendChild(div);

  //fade out sender and caption at half time of the shown image
  setTimeout(function() {
    $(sender).velocity("fadeOut", {
      duration: fadeTime / 2
    });
    $(caption).velocity("fadeOut", {
      duration: fadeTime / 2
    });
  }, config.interval / 2);
}

//notify user of incoming image and restart slideshow with the newest image
function newAsset(sender, type) {
  assets = remote.getGlobal("assets");
  if (type == "image") {
    Swal.fire({
      title: config.newPhotoMessage + " " + sender,
      showConfirmButton: false,
      timer: 5000,
      type: "success"
    }).then((value) => {
      currentAssetIndex = assets.length;
      loadAsset(true, 0);
    });
  } else if (type == "video") {
    Swal.fire({
      title: config.newVideoMessage + " " + sender,
      showConfirmButton: false,
      timer: 5000,
      type: "success"
    }).then((value) => {
      currentAssetIndex = assets.length;
      loadAsset(true, 0);
    });
  }
}

//start slideshow of assets
loadAsset(true, config.fadeTime);
