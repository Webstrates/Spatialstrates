import React from 'react';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addItem, ControllerMenuButton } from '#ControllerMenu .default';
import { createMovable } from '#Movable .helpers';
import { getDeviceFromInputEvent } from '#Spatialstrates .transform-helpers';



addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'add-trashcan', <MenuButton onClick={() => createMovable(window.moduleDeviceManager.camera, 'Trashcan')}>New Trashcan</MenuButton>, 100);
addItemToSubMenu('movables', 'spacer-items', <MenuSpacer />, 400);

addItem('add-trashcan', <ControllerMenuButton position={[0.04, 0.06, 0]} name={'New Trashcan'} callback={(e) => createMovable(getDeviceFromInputEvent(e), 'Trashcan')} />);
