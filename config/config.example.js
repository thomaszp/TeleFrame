var config = {
  botToken: "",
  whitelistChats: [],
  playSoundOnReceive: "sound1.mp3",
  showVideos: true,
  playVideoAudio: false,
  assetFolder: "assets",
  fullscreen: true,
  fadeTime: 1500,
  interval: 10 * 1000,
  assetCount: 30,
  newPhotoMessage: "Neues Foto von",
  newVideoMessage: "Neues Video von",
  newTextMessage: "Neue Nachricht von",
  showSender: true,
  showCaption: true,
  toggleMonitor: false,
  turnOnHour: 9,
  turnOffHour: 22,
  keys: {
    next: "right",
    previous: "left",
    play: "l",
    pause: "k"
  },
  voiceReply: {
    key: "a",
    maxRecordTime: 60*1000,
    recordingMessageTitle: "Voice Message",
    recordingPreMessage: "Recording for",
    recordingPostMessage: "in progress...",
    recordingDone: "Voice message sent sucessfully!",
    recordingError: "Voice message has failed!"
  }
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = config;
}
