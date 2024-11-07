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
import { deselectMovables, deleteSelectedMovable, cloneSelectedMovable } from '#Movable .helpers';



// function MultiSelectButton() {
//     const [multiSelect, setMultiSelect] = useProperty('multiSelect');
//     return <MenuButton onClick={() => setMultiSelect(!multiSelect)} toggled={multiSelect ? 'true' : null}>Toggle Multi-Select</MenuButton>;
// }

addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'clone', <MenuButton onClick={cloneSelectedMovable}>Clone</MenuButton>, 500);
addItemToSubMenu('movables', 'delete', <MenuButton className="red" onClick={deleteSelectedMovable}>Delete</MenuButton>, 500);
addItemToSubMenu('movables', 'spacer1', <MenuSpacer />, 550);
// addItemToSubMenu('movables', 'multi-select', <Varv concept="MovableManager">
//     <MultiSelectButton />
// </Varv>, 600);
addItemToSubMenu('movables', 'deselect', <MenuButton onClick={deselectMovables}>Deselect Objects</MenuButton>, 700);

// function MultiSelectControllerButton() {
//     const [multiSelect, setMultiSelect] = useProperty('multiSelect');
//     return <ControllerMenuButton position={[-0.12, 0.06, 0]} name={'Toggle Multi-Select'} theme={multiSelect ? 'button:toggled' : null} callback={() => setMultiSelect(!multiSelect)} />;
// }

addItem('clone', <ControllerMenuButton position={[-0.04, 0.06, 0]} name={'Clone'} callback={cloneSelectedMovable} />);
addItem('delete', <ControllerMenuButton position={[-0.04, 0, 0]} name={'Delete'} theme="deleteButton" callback={deleteSelectedMovable} />);
// addItem('multi-select', <Varv concept="MovableManager">
//     <MultiSelectControllerButton />
// </Varv>);
addItem('deselect', <ControllerMenuButton position={[-0.12, 0, 0]} name={'Deselect All'} callback={deselectMovables} />);
