import React from 'react';

import { createMovable } from '#Spatialstrates .movable-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuSpacer, ControllerMenuButton } from '#ControllerMenu .default';



addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'add-sticky-note', <MenuButton onClick={() => createMovable('StickyNote')}>New Sticky Note</MenuButton>, 200);
addItemToSubMenu('movables', 'spacer-items', <MenuSpacer />, 400);

addControllerSubMenu('movables', 100, false);
addItemToControllerSubMenu('movables', 'title', <ControllerMenuTitle title="Menu" />, 0);
addItemToControllerSubMenu('movables', 'add-sticky-note', <ControllerMenuButton onClick={() => createMovable('StickyNote')}>New Sticky Note</ControllerMenuButton>, 200);
addItemToControllerSubMenu('movables', 'spacer-items', <ControllerMenuSpacer />, 400);
