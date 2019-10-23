var TextContainer = class {
    constructor(asset) {
        this.asset = asset;
    }

    createContainer() {
        var assetTag = document.createElement("embed");
        assetTag.src = this.asset.src;
        assetTag.className = "text";
        assetTag.style.width = "100%";

        return assetTag;
    }
}

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
    module.exports = TextContainer;
}