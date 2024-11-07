# Code Structure

The code of Spatialstrates is modular and organized into the structure below. The functionality is structured into five main folders which each include multiple WPM ([Webstrates Package Manager](https://codestrates.projects.cavi.au.dk/docs/guide/webstrates-package-manager/)) packages.

Each package defines their own dependencies, and the WPM GUI in Cauldron can be used to define which packages should be loaded. For instance, if the WebRTC streaming features are not required, one can simply tick off the `StreamingBundle` package in the WPM GUI to avoid loading it.

> [!WARNING]
> Some of the below documentation is slightly outdated and requires revision.


## [Bundles](/fragment-sync/Bundles)

This folder contains four WPM bundles that include multiple packages. This makes importing certain types of functionality easier, as less individual packages have to be imported.


### [Spatialstrates Basic Bundle](/fragment-sync/Bundles/SpatialstratesBasicBundle.wpm)

- [Spatialstrates](#📦-spatialstrates)
- [Menu](#📦-menu)
- [Controller Menu](#📦-controller-menu)
- [Basic Menu](#📦-basic-menu)


### [Spatialstrates Add-Ons Bundle](/fragment-sync/Bundles/SpatialstratesAddOnsBundle.wpm)

- [Spatialstrates Logo](#📦-spatialstrates-logo)
- [Calibration Point](#📦-calibration-point)
- [User Manager](#📦-user-manager)
- [Avatar](#📦-avatar)


### [Streaming Bundle](/fragment-sync/Bundles/StreamingBundle.wpm)

- [Stream Manager](#streaming-utils)
- [Screen Stream Manager](#streaming-utils)
- [Video Stream Manager](#streaming-utils)
- [Audio Stream Manager](#streaming-utils)
- [Screen Stream](#streaming-components)
- [Video Stream](#streaming-components)
- [Audio Stream](#streaming-components)


### [Movable Bundle](/fragment-sync/Bundles/MovableBundle.wpm)

- [Movable](#📦-movable)
- [Sticky Note](#📦-sticky-note)
- [Image](#📦-image)
- [Trashcan](#📦-trashcan)
- [Screenshots](#📦-screenshots)


## [Core](/fragment-sync/Core)

The main components of Spatialstrates that bootstrap the system.


### [📦 Import Mapping](/fragment-sync/Core/ImportMapping.wpm)

Includes the [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) used in `import` statements. It uses the `esm.sh` CDN for serving ES modules.

For development we use the `?dev` version of modules in the import map. We also use the `*` operator in front of modules, which prevents the import of dependencies. This is necessary as some packages otherwise import different versions of React or R3F, which causes all kinds of issues. For some packages, like Vega or D3, we omit the `*` operator as those are largely self-contained and so far did not cause conflicts with other packages.

If additional packages are needed, they can be added to the import map here.


### [📦 Spatialstrates](/fragment-sync/Core/Spatialstrates.wpm)

The main package that bootstraps Spatialstrates. The `React Reloader` fragment creates a React root and initializes it with the `App` component. It also listens for changes to the `App` component and the Varv model and reloads Spatialstrates when either of them changes.

The `App` component creates the R3F scene and XR session. It handles what basic elements are visible in the scene, e.g., lighting and the grey background.

Apart from that, the package includes basic styling, the `Mesh Cache`, an optimization that preloads and caches 3D models to avoid loading them multiple times, and the `Camera`, a custom camera that can be controlled using the mouse and keyboard.

See the [Dynamic Components API](spatialstrates-api.md#dynamic-components) for how to add dynamic components to Spatialstrates.


## [Basic](/fragment-sync/Basic)

These packages provide the basic functionality of Spatialstrates.


### [📦 Menu](/fragment-sync/Basic/Components/Menu.wpm)

The 2D menu on the bottom of a spatialstrate. It includes a simple API to add menu groups and entries. See the [Menu API](spatialstrates-api.md#menu) on how to use it.


### [📦 Controller Menu](/fragment-sync/Basic/Components/ControllerMenu.wpm)

The menu that is displayed on top of a controller when in immersive XR. Like the normal menu, it includes a simple API to add menu entries. See the [Controller Menu API](spatialstrates-api.md#controller-menu) on how to use it.


### [📦 Basic Menu](/fragment-sync/Basic/Components/BasicMenu.wpm)

The basic menu entries to move the camera, toggle AR and VR, and to send the link of a spatialstrate to one's Quest headset.

In this package also the parameters and features for the WebXR session are defined.


### [📦 Icon Util](/fragment-sync/Basic/Utils/Icon.wpm)

A helper utility that renders 3D icons that can be themed and used in the scene. Color themes of icons need to be supported by the 3D models for this to work.


### [📦 Text Util](/fragment-sync/Basic/Utils/Text.wpm)

A utility that renders text in the 3D scene. It is a wrapper for the R3F Drei "[Text](https://drei.docs.pmnd.rs/abstractions/text)" component that sets the font to a custom font. It can also be helpful when trying to globally disable text rendering in the scene to investigate its performance impact. (Text rendering is quite expensive.)


## [Add-Ons](/fragment-sync/Add-Ons)

Various useful add-ons for Spatialstrates.


### [📦 Spatialstrates Logo](/fragment-sync/Add-Ons/Components/SpatialstratesLogo.wpm)

A small package that adds the header logo in the top left corner of Spatialstrates and indicates the version number.


### [📦 Calibration Point](/fragment-sync/Add-Ons/Components/CalibrationPoint.wpm)

A utility that renders a tringular object in immersive XR that allows to calibrate the scene. This is required, as WebXR does not yet support persisted anchors and the XR scene always starts with the origin at the center of the headset where it was started from.

The calibration point can be moved using the motion controller and should be aligned with a salient point in the physical world, e.g., a corner of a table. It should also be placed close to the center of the room or 3D scene, as small errors in the alignment rotation can lead to large offsets in the scene the further away the calibration point is.


### [📦 User Manager](/fragment-sync/Add-Ons/Components/UserManager.wpm)

A small user manager utility that allows to add and select users. It is used by the avatar functionality to display the name of a user above their avatar.

The user manager uses a hard-coded default user that is always selected when starting Spatialstrates. It can be changed by opening the user manager dialog with the button in the top right corner.

The user is not stored between sessions and has to be selected again when starting Spatialstrates.


### [📦 Avatar](/fragment-sync/Add-Ons/Components/Avatar.wpm)

The avatar functionality that displays an avatar for each user in the scene. Avatars are generated for the camera of each user and the controllers of users in immersive XR. Different models are used for the desktop users, phone users, and HMD users. Avatars can be toggled on and off using the menu. Toggling them on or off is a global action that affects all users.

Controller and HMD models always show the Meta Quest 3 models. For broader compatibility, more models and a better detection of the user agent should be added.

**Note**: Using avatars impacts the performance of Spatialstrates on the Quest 3 and Quest Pro significantly.


### [📦 AI Helpers Util](/fragment-sync/Add-Ons/Utils/AIHelpers.wpm)

A small set of helper functions to access the transcribe audio using Whisper and to create completion calls towards the OpenAI API.


## [Streaming](/fragment-sync/Streaming)

These packages provide the functionality to stream audio and video in Spatialstrates.


### [Streaming Components](/fragment-sync/Streaming/Components)

This folder includes the dynamic components for the streaming functionality. Screen streams are rendered in the scene as a [Movable](#movables) object, video streams are placed on top of user's [avatars](#avatar), and audio streams are invisible but transmit the microphone input to other clients.

These components also add menu entries to start and stop each of the stream types.


### [Streaming Utils](/fragment-sync/Streaming/Utils/)

This folder includes a basic `StreamManager` class that is initialized for audio, video, and screen streams. These managers manage the signal streams created using the Webstrates [signal streaming API](https://webstrates.github.io/userguide/api/signaling.html#signal-streaming). They also provide helper functions on the `window` object to start and stop the streams.


## [Movables](/fragment-sync/Movables)

Movables are a class of components that are placed in the 3D scene and that have their position and rotation persisted and synchronized using Varv. They can be moved both using the mouse and keyboard, and using motion controllers or hand tracking in immersive XR.

The mechanism enabling Movables is quite complex and should not be changed unless necessary. It uses a mix of R3F components and Varv actions to facilitate shared 3D objects in the scene. In the future, the Varv part probably will be removed to improve performance.

This component is necessary, as the state of the 3D scene is otherwise not synchronized among clients. Hence, all other 3D objects placed in the scene are by default transient and do not share state with other clients.


### [📦 Movable](/fragment-sync/Movables/Base/Movable.wpm)

This package includes the basic functionality of Movables.


### [📦 Sticky Note](/fragment-sync/Movables/Components/StickyNote.wpm)

A simple virtual sticky note component that can be moved around in the scene. It can be modified using the microphone icon to transcribe audio.

This component is a good example of how to create components that use the Movable component, due to its simple structure.


### [📦 Image](/fragment-sync/Movables/Components/Image.wpm)

A simple image component. Images can, so far, only be added using the "Upload Image" menu entry. The uploaded image is then added as a Webstrate asset and placed in the scene.


### [📦 Trashcan](/fragment-sync/Movables/Components/Trashcan.wpm)

The trashcan is another simple component that can be used to delete other components from the scene. It is a good example of how to create components that interact with other movables in the scene.


### [📦 Screenshots](/fragment-sync/Movables/Add-ons/Screenshots.wpm)

This package includes a small screenshot utility that adds a button to the menu, which takes a screenshot of the scene, uploads it as an Webstrate asset, and places it in the 3D scene as an image component.
