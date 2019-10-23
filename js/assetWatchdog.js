const fs = require('fs');

var AssetWatchdog = class {
    constructor(assetFolder, assetCount, assets, emitter, logger) {
        this.assetFolder = assetFolder;
        this.assetCount = assetCount;
        this.assets = assets;
        this.logger = logger;
        this.emitter = emitter;

        //get paths of already downloaded assets
        if (fs.existsSync(this.assetFolder + '/' + "assets.json")) {
            fs.readFile(this.assetFolder + '/' + "assets.json", (err, data) => {
                if (err) throw err;
                var jsonData = JSON.parse(data);
                for (var asset in jsonData) {
                    this.assets.push(jsonData[asset]);
                }
            });
        } else {
            this.saveAssetArray()
        }
    }

    newAsset(type, src, sender, caption, chatId, chatName, messageId) {
        //handle new incoming asset
        // TODO: message ID and chat name to reply to specific asset and to show
        //         chat name for voice recording message
        this.assets.unshift({
            'src': src,
            'sender': sender,
            'caption': caption,
            'chatId': chatId,
            'chatName': chatName,
            'messageId': messageId
        });
        if (this.assets.length >= this.assetCount) {
            this.assets.pop();
        }
        //notify frontend, that new asset arrived
        this.emitter.send('newAsset', {
            sender: sender,
            type: type
        });
        this.saveAssetArray();
    }

    saveAssetArray() {
        var self = this;
        // stringify JSON Object
        var jsonContent = JSON.stringify(this.assets);
        fs.writeFile(this.assetFolder + '/' + "assets.json", jsonContent, 'utf8', function (err) {
            if (err) {
                self.logger.error("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
        });
    }

}

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
    module.exports = AssetWatchdog;
}
