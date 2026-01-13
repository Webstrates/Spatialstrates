import React from 'react';

import { createMovable } from '#Spatialstrates .movable-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuSpacer, ControllerMenuButton } from '#ControllerMenu .default';



addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'add-model-shelf', <MenuButton onClick={() => createMovable('ModelShelf')}>New Model Gallery</MenuButton>, 350);
addItemToSubMenu('movables', 'spacer-items', <MenuSpacer />, 400);

addControllerSubMenu('movables', 100, false);
addItemToControllerSubMenu('movables', 'title', <ControllerMenuTitle title="Menu" />, 0);
addItemToControllerSubMenu('movables', 'add-model-shelf', <ControllerMenuButton onClick={() => createMovable('ModelShelf')}>New Model Gallery</ControllerMenuButton>, 350);
addItemToControllerSubMenu('movables', 'spacer-items', <ControllerMenuSpacer />, 400);
