import React from 'react';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addItem, ControllerMenuButton } from '#ControllerMenu .default';
import { createMovable } from '#Movable .helpers';
import { getDeviceFromInputEvent } from '#Spatialstrates .transform-helpers';



addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'add-sticky-note', <MenuButton onClick={() => createMovable(window.moduleDeviceManager.camera, 'StickyNote')}>New Sticky Note</MenuButton>, 200);
addItemToSubMenu('movables', 'spacer-items', <MenuSpacer />, 400);

addItem('add-sticky-note', <ControllerMenuButton position={[0.04, 0, 0]} name={'New Sticky Note'} callback={(e) => createMovable(getDeviceFromInputEvent(e), 'StickyNote')} />);
