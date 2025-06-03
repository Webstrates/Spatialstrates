import React from 'react';

import { createMovable } from '#Spatialstrates .movable-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuSpacer, ControllerMenuButton } from '#ControllerMenu .default';



addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'add-flashlight-note', <MenuButton onClick={() => createMovable('Flashlight')}>New Flashlight</MenuButton>, 350);
addItemToSubMenu('movables', 'spacer-items', <MenuSpacer />, 400);

addControllerSubMenu('movables', 100, false);
addItemToControllerSubMenu('movables', 'title', <ControllerMenuTitle title="Menu" />, 0);
addItemToControllerSubMenu('movables', 'add-flashlight-note', <ControllerMenuButton onClick={() => createMovable('Flashlight')}>New Flashlight</ControllerMenuButton>, 350);
addItemToControllerSubMenu('movables', 'spacer-items', <ControllerMenuSpacer />, 400);
