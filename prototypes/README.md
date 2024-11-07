# Prototypes

The files in this folder are used to create instances of Spatialstrates on a Webstrates server using a prototype ZIP archive (see more info in the [Webstrates documentation](https://webstrates.github.io/userguide/api/prototype-restore-delete.html)).


## Folders and ZIP Files

The ZIP files are the packaged prototypes in a format that can be uploaded to a Webstrates server. The `assets` folder contains the Webstrates assets that are also included in the ZIP files. The other two folders contain the same `index.html` as the respective ZIP file and are intended to help to keep track of version changes as these are otherwise opaque in the ZIP files.



## Shallow and Embedded Version

The shallow prototype of Spatialstrates does not embed Spatialstrates packages, but instead loads them from the GitHub [repository](/repository). This means, that updates to the GitHub repository are automatically available in the created prototype. For most use cases, this is the recommended way to create a new instance of Spatialstrates.

The embedded prototype of Spatialstrates embeds the Spatialstrates packages into the webstrate. Changes from GitHub are not automatically applied and the prototype includes a “frozen” version of Spatialstrates. This is useful if you want to create a prototype that is not affected by changes in the GitHub repository. It also makes the implementation code of Spatialstrates accessible from within Cauldron, so that it can be easily modified.
