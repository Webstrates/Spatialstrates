import React from 'react';

import { addSubMenu, addItemToSubMenu, MenuSpacer, MenuButton } from '#Menu .default';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuSpacer, ControllerMenuButton } from '#ControllerMenu .default';



// Import in order to start the manager
import AudioStreamManager from '#AudioStreamManager .default';



addSubMenu('media-sharing', 500, false);
addItemToSubMenu('media-sharing', 'share-audio', <MenuButton onClick={window.shareMyAudio}>Share Audio</MenuButton>, 500);
addItemToSubMenu('media-sharing', 'stop-audio', <MenuButton onClick={window.stopSharingMyAudio}>Stop Audio</MenuButton>, 600);
addItemToSubMenu('media-sharing', 'spacer3', <MenuSpacer />, 700);

addControllerSubMenu('media-sharing', 500, false);
addItemToControllerSubMenu('media-sharing', 'share-audio', <ControllerMenuButton onClick={window.shareMyAudio}>Share Audio</ControllerMenuButton>, 500);
addItemToControllerSubMenu('media-sharing', 'stop-audio', <ControllerMenuButton onClick={window.stopSharingMyAudio}>Stop Audio</ControllerMenuButton>, 600);
addItemToControllerSubMenu('media-sharing', 'spacer3', <ControllerMenuSpacer />, 700);
