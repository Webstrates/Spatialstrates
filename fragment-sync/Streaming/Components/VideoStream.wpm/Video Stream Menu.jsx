import React from 'react';

import { addSubMenu, addItemToSubMenu, MenuSpacer, MenuButton } from '#Menu .default';



// Import in order to start the manager
import VideoStreamManager from '#VideoStreamManager .default';



addSubMenu('media-sharing', 500, false);
addItemToSubMenu('media-sharing', 'share-video', <MenuButton onClick={window.shareMyVideo}>Share Video</MenuButton>, 300);
addItemToSubMenu('media-sharing', 'stop-video', <MenuButton onClick={window.stopSharingMyVideo}>Stop Video</MenuButton>, 400);
addItemToSubMenu('media-sharing', 'spacer2', <MenuSpacer />, 450);
