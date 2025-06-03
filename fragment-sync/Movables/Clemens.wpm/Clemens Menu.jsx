import React from 'react';

import { createMovable } from '#Spatialstrates .movable-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuSpacer, ControllerMenuButton } from '#ControllerMenu .default';



addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'add-clemens', <MenuButton onClick={() => createMovable('Clemens')}>New Clemens</MenuButton>, 390);
addItemToSubMenu('movables', 'spacer-items', <MenuSpacer />, 400);

addControllerSubMenu('movables', 100, false);
addItemToControllerSubMenu('movables', 'title', <ControllerMenuTitle title="Menu" />, 0);
addItemToControllerSubMenu('movables', 'add-clemens', <ControllerMenuButton onClick={() => createMovable('Clemens')}>New Clemens</ControllerMenuButton>, 390);
addItemToControllerSubMenu('movables', 'spacer-items', <ControllerMenuSpacer />, 400);
