import React from 'react';

import { createMovable } from '#Spatialstrates .movable-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuSpacer, ControllerMenuButton } from '#ControllerMenu .default';



addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'add-container', <MenuButton onClick={() => createMovable('Container')}>New Container</MenuButton>, 200);
addItemToSubMenu('movables', 'spacer-items', <MenuSpacer />, 500);

addControllerSubMenu('movables', 100, false);
addItemToControllerSubMenu('movables', 'title', <ControllerMenuTitle title="Menu" />, 0);
addItemToControllerSubMenu('movables', 'add-container', <ControllerMenuButton onClick={() => createMovable('Container')}>New Container</ControllerMenuButton>, 200);
addItemToControllerSubMenu('movables', 'spacer-items', <ControllerMenuSpacer />, 500);
