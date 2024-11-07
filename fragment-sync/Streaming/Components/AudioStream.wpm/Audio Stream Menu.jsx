import React from 'react';
import { addSubMenu, addItemToSubMenu, MenuSpacer, MenuButton } from '#Menu .default';
import { addItem, ControllerMenuButton } from '#ControllerMenu .default';



// Import in order to start the manager
import AudioStreamManager from '#AudioStreamManager .default';



addSubMenu('media-sharing', 500, false);
addItemToSubMenu('media-sharing', 'share-audio', <MenuButton onClick={window.shareMyAudio}>Share Audio</MenuButton>, 500);
addItemToSubMenu('media-sharing', 'stop-audio', <MenuButton onClick={window.stopSharingMyAudio}>Stop Audio</MenuButton>, 600);
addItemToSubMenu('media-sharing', 'spacer3', <MenuSpacer />, 700);

addItem('share-audio', <ControllerMenuButton position={[0.12, 0.06, 0]} name={'Start Audio'} callback={window.shareMyAudio} />);
addItem('stop-audio', <ControllerMenuButton position={[0.12, 0, 0]} name={'Stop Audio'} callback={window.stopSharingMyAudio} />);
