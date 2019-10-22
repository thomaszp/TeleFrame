/*
Script for only running the telegram bot to save the images and videos to
the images folder specified in the config
*/

const {
  logger,
  rendererLogger
} = require('./js/logger')
const config = require('./config/config')
const telebot = require('./js/bot')
const fs = require('fs');


logger.info('Running bot only version of TeleFrame ...');


var ImageWatchdog = class {
  constructor(imageFolder, imageCount, logger) {
    this.imageFolder = imageFolder;
    this.imageCount = imageCount;
    this.logger = logger;
    this.images = []

    //get paths of already downloaded images
    if (fs.existsSync(this.imageFolder + '/' + "assets.json")) {
      fs.readFile(this.imageFolder + '/' + "assets.json", (err, data) => {
        if (err) throw err;
        var jsonData = JSON.parse(data);
        for (var image in jsonData) {
          this.images.push(jsonData[image]);
        }
      });
    } else {
      this.saveImageArray()
    }
  }

  newAsset(src, sender, caption) {
    //handle new incoming image
    this.images.unshift({
      'src': src,
      'sender': sender,
      'caption': caption
    });
    if (this.images.length >= this.imageCount) {
      this.images.pop();
    }
    var type;
    if (src.split('.').pop() == 'mp4') {
      type = 'video';
    } else {
      type = 'image';
    }
    this.saveImageArray();
  }

  saveImageArray() {
    var self = this;
    // stringify JSON Object
    var jsonContent = JSON.stringify(this.images);
    fs.writeFile(this.imageFolder + '/' + "assets.json", jsonContent, 'utf8', function(err) {
      if (err) {
        self.logger.error("An error occured while writing JSON Object to File.");
        return console.log(err);
      }
    });
  }

}

// create imageWatchdog and bot
const imageWatchdog = new ImageWatchdog(config.assetFolder, config.imageCount, logger);
var bot = new telebot(config.botToken, config.assetFolder, imageWatchdog, config.showVideos, logger);

bot.startBot()
