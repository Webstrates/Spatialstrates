# Controller Menu

The menu includes a small API to create submenus and entries. All components are imported from `'#ControllerMenu .default'`.


## Methods

### `addControllerSubMenu`

Adds a submenu to the menu.

| Parameter       | Description                                                                     |
| --------------- | ------------------------------------------------------------------------------- |
| `id`            | The id of the submenu.                                                          |
| `weight`        | The weight of the submenu. Higher weights are further on the right side.        |
| `alwaysVisible` | Whether the submenu should always be expanded. If not, it will expand on hover. |


### `addItemToControllerSubMenu`

Adds a menu entry to a submenu.

| Parameter   | Description                                                                |
| ----------- | -------------------------------------------------------------------------- |
| `subMenuId` | The id of the submenu.                                                     |
| `id`        | The id of the menu entry.                                                  |
| `element`   | The element to render in the menu entry.                               |
| `weight`    | The weight of the menu entry. Higher weights are further down in the menu. |


## Components

### `<ControllerMenuTitle>`

A component to render a title in a submenu. Each submenu should only have one title.

| Parameter | Description               |
| --------- | ------------------------- |
| `title`   | The title of the submenu. |


### `<ControllerMenuSpacer>`

A component to render a spacer in a submenu.


### `<ControllerMenuButton>`

A component to render a button in a submenu.

| Parameter   | Description                                      |
| ----------- | ------------------------------------------------ |
| `onClick`   | The function to call when the button is clicked. |
| `toggled`   | Whether the button is toggled on or not.         |
| `children`  | The content of the button.                       |


## Example

This shows how to create a new sub menu with a title and a button:

```javascript
import React from 'react';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuSpacer, ControllerMenuButton } from '#Menu .default';

addControllerSubMenu('my-sub-menu', 200, true);
addItemToControllerSubMenu('my-sub-menu', 'my-title', <ControllerMenuTitle title="My Sub Menu" />);
addItemToControllerSubMenu('my-sub-menu', 'my-button', <ControllerMenuButton onClick={() => console.log('Button clicked')}>My Button</ControllerMenuButton>);
```
