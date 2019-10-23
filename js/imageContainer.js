var ImageContainer = class {
    screenAspectRatio;
    imageAspectRatio;
    constructor(asset, div) {
        this.asset = asset;
        this.div = div;
    }

    createContainer() {
        var assetTag = document.createElement("img");
        assetTag.src = this.asset.src;
        assetTag.className = "image";

        assetTag.onload = function() {
            this.screenAspectRatio =
                remote
                    .getCurrentWindow()
                    .webContents.getOwnerBrowserWindow()
                    .getBounds().width /
                remote
                    .getCurrentWindow()
                    .webContents.getOwnerBrowserWindow()
                    .getBounds().height;
            /*this.imageAspectRatio = assetTag.naturalWidth / assetTag.naturalHeight;
            if (imageAspectRatio > screenAspectRatio) {
                assetTag.style.width = "100%";
                this.div.style.width = "100%";
            } else {
                assetTag.style.height = "100%";
                this.div.style.height = "100%";
            }*/
            assetTag.style.height = "100%";
            this.div.style.color = "dummy";
        };

        return assetTag;
    }
}

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
    module.exports = ImageContainer;
}