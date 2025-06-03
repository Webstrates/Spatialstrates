import React from 'react';

import { deselectMovables, deleteSelectedMovable, cloneSelectedMovable } from '#Spatialstrates .movable-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuSpacer, ControllerMenuButton } from '#ControllerMenu .default';



addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'clone', <MenuButton onClick={cloneSelectedMovable}>Clone</MenuButton>, 500);
addItemToSubMenu('movables', 'delete', <MenuButton className="red" onClick={deleteSelectedMovable}>Delete</MenuButton>, 500);
addItemToSubMenu('movables', 'spacer1', <MenuSpacer />, 550);
addItemToSubMenu('movables', 'deselect', <MenuButton onClick={deselectMovables}>Deselect Objects</MenuButton>, 700);

addControllerSubMenu('movables', 100, false);
addItemToControllerSubMenu('movables', 'title', <ControllerMenuTitle title="Menu" />, 0);
addItemToControllerSubMenu('movables', 'clone', <ControllerMenuButton onClick={cloneSelectedMovable}>Clone</ControllerMenuButton>, 500);
addItemToControllerSubMenu('movables', 'delete', <ControllerMenuButton className="red" onClick={deleteSelectedMovable}>Delete</ControllerMenuButton>, 500);
addItemToControllerSubMenu('movables', 'spacer1', <ControllerMenuSpacer />, 550);
addItemToControllerSubMenu('movables', 'deselect', <ControllerMenuButton onClick={deselectMovables}>Deselect Objects</ControllerMenuButton>, 700);
