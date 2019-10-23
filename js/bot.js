const Telegraf = require("telegraf");
const Telegram = require("telegraf/telegram");
const Extra = require('telegraf/extra')
const download = require("image-downloader");
const moment = require("moment");

const fs = require(`fs`);

var Bot = class {
  constructor(
    botToken,
    assetFolder,
    assetWatchdog,
    showVideo,
    whitelistChats,
    voiceReply,
    logger
  ) {
    var self = this;
    this.bot = new Telegraf(botToken);
    this.telegram = new Telegram(botToken);
    this.logger = logger;
    this.assetFolder = assetFolder;
    this.assetWatchdog = assetWatchdog;
    this.showVideo = showVideo;
    this.whitelistChats = whitelistChats;
    this.voiceReply = voiceReply;

    //get bot name
    this.bot.telegram.getMe().then((botInfo) => {
      this.bot.options.username = botInfo.username;
      this.logger.info(
        "Using bot with name " + this.bot.options.username + "."
      );
    });

    //Welcome message on bot start
    this.bot.start((ctx) => ctx.reply("Welcome"));

    //Help message
    this.bot.help((ctx) => ctx.reply("Send me an image."));

    //Download incoming document
    this.bot.on("document", (ctx) => {
      if (
          (
              this.whitelistChats.length > 0 &&
              this.whitelistChats.indexOf(ctx.message.chat.id) == -1
          )
      ) {
        this.logger.info(
            "Whitelist triggered:",
            ctx.message.chat.id,
            this.whitelistChats,
            this.whitelistChats.indexOf(ctx.message.chat.id)
        );
        ctx.reply(
            "Hey there, this bot is whitelisted, pls add your chat id to the config file"
        );
        return;
      }

      this.telegram
          .getFileLink(ctx.message.document.file_id)
          .then((link) => {
            download
                .image({
                  url: link,
                  dest: this.assetFolder + "/" + moment().format("x") + ".jpg"
                })
                .then(({ filename, image }) => {
                  var chatName = ''
                  if (ctx.message.chat.type == 'group') {
                    chatName = ctx.message.chat.title;
                  } else if (ctx.message.chat.type == 'private') {
                    chatName = ctx.message.from.first_name;
                  }
                  this.newAsset(
                      "document",
                      filename,
                      ctx.message.from.first_name,
                      ctx.message.caption,
                      ctx.message.chat.id,
                      chatName,
                      ctx.message.message_id
                  );
                })
                .catch((err) => {
                  this.logger.error(err);
                });
          });
    });

    //Download incoming text messages
    this.bot.on("text", (ctx) => {
      if (
          (
              this.whitelistChats.length > 0 &&
              this.whitelistChats.indexOf(ctx.message.chat.id) == -1
          )
      ) {
        this.logger.info(
            "Whitelist triggered:",
            ctx.message.chat.id,
            this.whitelistChats,
            this.whitelistChats.indexOf(ctx.message.chat.id)
        );
        ctx.reply(
            "Hey there, this bot is whitelisted, pls add your chat id to the config file"
        );
        return;
      }

      var filename = this.assetFolder + "/" + moment().format("x") + ".txt";
      fs.writeFile(filename, ctx.message.text, function (err) {
        if (err) throw err;
      });

      var chatName = ''
      if (ctx.message.chat.type == 'group') {
        chatName = ctx.message.chat.title;
      } else if (ctx.message.chat.type == 'private') {
        chatName = ctx.message.from.first_name;
      }
      this.newAsset(
          "text",
          filename,
          ctx.message.from.first_name,
          ctx.message.caption,
          ctx.message.chat.id,
          chatName,
          ctx.message.message_id
      );
    });

    //Download incoming photo
    this.bot.on("photo", (ctx) => {
      if (
        (
          this.whitelistChats.length > 0 &&
          this.whitelistChats.indexOf(ctx.message.chat.id) == -1
        )
      ) {
        this.logger.info(
          "Whitelist triggered:",
          ctx.message.chat.id,
          this.whitelistChats,
          this.whitelistChats.indexOf(ctx.message.chat.id)
        );
        ctx.reply(
          "Hey there, this bot is whitelisted, pls add your chat id to the config file"
        );
        return;
      }

      this.telegram
        .getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id)
        .then((link) => {
          download
            .image({
              url: link,
              dest: this.assetFolder + "/" + moment().format("x") + ".jpg"
            })
            .then(({ filename, image }) => {
              var chatName = ''
              if (ctx.message.chat.type == 'group') {
                chatName = ctx.message.chat.title;
              } else if (ctx.message.chat.type == 'private') {
                chatName = ctx.message.from.first_name;
              }
              this.newAsset(
                "image",
                filename,
                ctx.message.from.first_name,
                ctx.message.caption,
                ctx.message.chat.id,
                chatName,
                ctx.message.message_id
              );
            })
            .catch((err) => {
              this.logger.error(err);
            });
        });
    });

    //Download incoming video
    this.bot.on("video", (ctx) => {
      if (
          (
              this.whitelistChats.length > 0 &&
              this.whitelistChats.indexOf(ctx.message.chat.id) == -1
          )
      ) {
        this.logger.info(
          "Whitelist triggered:",
          ctx.message.chat.id,
          this.whitelistChats,
          this.whitelistChats.indexOf(ctx.message.chat.id)
        );
        ctx.reply(
          "Hey there, this bot is whitelisted, pls add your chat id to the config file"
        );
        return;
      }

      if (this.showVideo) {
        this.telegram.getFileLink(ctx.message.video.file_id).then((link) => {
          download
            .image({
              url: link,
              dest: this.assetFolder + "/" + moment().format("x") + ".mp4"
            })
            .then(({ filename, image }) => {
              var chatName = ''
              if (ctx.message.chat.type == 'group') {
                chatName = ctx.message.chat.title;
              } else if (ctx.message.chat.type == 'private') {
                chatName = ctx.message.from.first_name;
              }
              this.newAsset(
                "video",
                filename,
                ctx.message.from.first_name,
                ctx.message.caption,
                ctx.message.chat.id,
                chatName,
                ctx.message.message_id
              );
            })
            .catch((err) => {
              this.logger.error(err);
            });
        });
      }
    });

    this.bot.catch((err) => {
      this.logger.error(err);
    });

    //Some small conversation
    this.bot.hears(/hi/i, (ctx) => {
      ctx.reply(
        `Hey there ${ctx.chat.first_name} \n Your ChatID is ${ctx.chat.id}`
      );
      this.logger.info(ctx.chat);
    });

    this.logger.info("Bot created!");
  }

  startBot() {
    //Start bot
    var self = this;
    this.bot.startPolling(30, 100, null, () =>
      setTimeout(() => self.startBot(), 30000)
    );
    this.logger.info("Bot started!");
  }

  newAsset(type, src, sender, caption, chatId, chatName, messageId) {
    //tell assetWatchdog that a new asset arrived
    this.assetWatchdog.newAsset(type, src, sender, caption, chatId, chatName, messageId);
  }

  sendMessage(message) {
    // function to send messages, used for whitlist handling
    return this.bot.telegram.sendMessage(this.whitelistChats[0], message);
  }

  sendAudio(filename, chatId, messageId) {
    // function to send recorded audio as voice reply
    fs.readFile(
      filename,
      function(err, data) {
        if (err) {
          this.logger.error(err);
          return;
        }
          this.telegram
            .sendVoice(chatId, {
              source: data
            }, {
              reply_to_message_id: messageId
            })
            .then(() => {
              this.logger.info("success");
            })
            .catch((err) => {
              this.logger.error("error", err);
            });

      }.bind(this)
    );
  }
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = Bot;
}
