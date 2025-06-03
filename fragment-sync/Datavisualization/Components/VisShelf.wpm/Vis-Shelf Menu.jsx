import React from 'react';

import { createMovable } from '#Spatialstrates .movable-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuSpacer, ControllerMenuButton } from '#ControllerMenu .default';



addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'add-vis-shelf', <MenuButton onClick={() => createMovable('VisShelf')}>New Bookshelf</MenuButton>, 300);
addItemToSubMenu('movables', 'spacer-items', <MenuSpacer />, 400);

addControllerSubMenu('movables', 100, false);
addItemToControllerSubMenu('movables', 'title', <ControllerMenuTitle title="Menu" />, 0);
addItemToControllerSubMenu('movables', 'add-vis-shelf', <ControllerMenuButton onClick={() => createMovable('VisShelf')}>New Bookshelf</ControllerMenuButton>, 300);
addItemToControllerSubMenu('movables', 'spacer-items', <ControllerMenuSpacer />, 400);
