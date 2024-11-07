import React from 'react';
import {
    addSubMenu,
    addItemToSubMenu,
    MenuTitle,
    MenuSpacer,
    MenuButton
} from '#Menu .default';
import {
    addItem,
    ControllerMenuButton
} from '#ControllerMenu .default';
import { Varv, useProperty } from '#VarvReact';



function AvatarToggleButton() {
    const [enabled, setEnabled] = useProperty('enabled');
    return <MenuButton onClick={() => setEnabled(!enabled)} toggled={enabled ? 'true' : null}>Toggle Avatars ({enabled ? 'On' : 'Off'})</MenuButton>;
}

addSubMenu('media-sharing', 500, false);
addItemToSubMenu('media-sharing', 'title', <MenuTitle title="Media Sharing" />, 0);
addItemToSubMenu('media-sharing', 'avatars', <Varv concept="AvatarManager">
    <AvatarToggleButton />
</Varv>, 750);
addItemToSubMenu('media-sharing', 'spacer4', <MenuSpacer />, 800);

function AvatarToggleControllerButton() {
    const [enabled, setEnabled] = useProperty('enabled');
    return <ControllerMenuButton position={[-0.18, 0.06, 0]} name={'Toggle Avatars'} theme={enabled ? 'button:toggled' : null} callback={() => setEnabled(!enabled)} />;
}

addItem('avatars', <Varv concept="AvatarManager">
    <AvatarToggleControllerButton />
</Varv>);
