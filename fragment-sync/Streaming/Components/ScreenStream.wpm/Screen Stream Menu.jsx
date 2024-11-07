import React from 'react';
import { addSubMenu, addItemToSubMenu, MenuSpacer, MenuButton } from '#Menu .default';



// Import in order to start the manager
import ScreenStreamManager from '#ScreenStreamManager .default';



addSubMenu('media-sharing', 500, false);
addItemToSubMenu('media-sharing', 'share-screen', <MenuButton onClick={window.shareMyScreen}>Share Screenshare</MenuButton>, 100);
addItemToSubMenu('media-sharing', 'stop-screen', <MenuButton onClick={window.stopSharingMyScreen}>Stop Screenshare</MenuButton>, 200);
addItemToSubMenu('media-sharing', 'spacer1', <MenuSpacer />, 250);
