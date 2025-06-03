import React from 'react';
import { Varv, useProperty } from '#VarvReact';

import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuButton } from '#ControllerMenu .default';



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
    return <ControllerMenuButton onClick={() => setEnabled(!enabled)} toggled={enabled ? 'true' : null}>Toggle Avatars ({enabled ? 'On' : 'Off'})</ControllerMenuButton>;
}
addControllerSubMenu('media-sharing', 500, false);
addItemToControllerSubMenu('media-sharing', 'title', <ControllerMenuTitle title="Media Sharing" />, 0);
addItemToControllerSubMenu('media-sharing', 'avatars', <Varv concept="AvatarManager">
    <AvatarToggleControllerButton />
</Varv>, 750);
