# Prototypes

The files in this folder are used to create instances of Spatialstrates on a Webstrates server using a prototype ZIP archive (see more info in the [Webstrates documentation](https://webstrates.github.io/userguide/api/prototype-restore-delete.html)).


## Folders and ZIP Files

The ZIP files are the packaged prototypes in a format that can be uploaded to a Webstrates server. The `assets` folder contains the Webstrates assets that are also included in the ZIP files. The other two folders contain the same `index.html` as the respective ZIP file and are intended to help to keep track of version changes as these are otherwise opaque in the ZIP files.


## Embedded Packages

The embedded prototype of Spatialstrates embeds the Spatialstrates packages into the webstrate. Changes from GitHub are not automatically applied and the prototype includes a “frozen” version of Spatialstrates. This is useful if you want to create a prototype that is not affected by changes in the GitHub repository. It also makes the implementation code of Spatialstrates accessible from within Cauldron, so that it can be easily modified.


## Creating a Copy

You can use one of the following link to create a new spatialstrate:

> https://demo.webstrates.net/new?prototypeUrl=https://github.com/Webstrates/Spatialstrates/raw/main/prototypes/spatialstrate.zip


## Updating the Prototype

To update the prototype download the current Spatialstrates prototype from your Webstrates server as a ZIP package. Unzip the package and replace the `index.html` file with the updated version from the `spatialstrate` folder. Do the same for any new or updated assets.

To clean the `index.html` file from any Webstrates-specific attributes (e.g., `data-auth` and `__wid`), you can use the provided `clean-index-html.sh` script.
