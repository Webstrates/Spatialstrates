# Spatialstrates

The `Spatialstrates` package provides the core functionality for the Spatialstrates application. It bootstraps the React root of the application and reloads the application when fragments inside the package are modified. It provides a series of helpers functions.


## Global Events

The Global Events API can be used to send events between components within Spatialstrates. Events have a custom name and can carry data.

### Example

```js
import { useGlobalEvents } from '#Spatialstrates .global-events';

function MyComponent() {
    const { triggerEvent, subscribeEvent } = useGlobalEvents();

    const handleClick = () => {
        triggerEvent('myCustomEvent', { data: 'Hello World' });
    };

    useEffect(() => {
        const unsubscribe = subscribeEvent('myCustomEvent', (event) => {
            console.log('Received event:', event.data);
        });

        return () => { unsubscribe(); };
    }, [subscribeEvent]);
}
```


## Custom Text Component

Spatialstrates provides a `<Text>` component that wraps the Drei [`<Text>`](https://drei.docs.pmnd.rs/abstractions/text) component. It changes the font used to the Inter font, which is the default font used in Spatialstrates. All other props from the Drei `<Text>` component are supported.

### Import

```js
import { Text } from '#Spatialstrates .text';
```


## Projection Helpers

The Projection Helpers API provides helper functions when using the 2D canvas view. It provides the scale used to convert between 2D and 3D coordinates, as well as a function to convert 2D coordinates to 3D coordinates (undocumented).

### Import

```js
import { CANVAS_SCALE } from '#Spatialstrates .projection-helpers';
```


## Movable Component

The Movable Component API provides a `<Movable>` component that can be used to create movable objects in the Spatialstrates application. It also provides a `useTransform` hook that can be used to transform the position, rotation, and scale of the movable object.

### Import

```js
import { Movable, useTransform } from '#Spatialstrates .movable';
```


## Movable Shape

The Movable Shape provides helper functions for creating movables in the 2D canvas view. All movable shape utils need to extend the `MovableShapeUtil` class. The `MovableVarvScope` component creates a Varv scrope within the shape to access properties of the movable.

### Import

```js
import {
    MovableShapeUtil,
    MovableVarvScope
} from '#Spatialstrates .movable-shape';
```


## Movable Helpers

The Movable Helpers API provides helper functions to create and manipulate movable objects in the Spatialstrates application. It includes functions to create a movable, deselect all movables, and to delete or clone the selected movable(s).

### Import

```js
import {
    createMovable,
    deselectMovables,
    deleteSelectedMovable,
    cloneSelectedMovable
} from '#Spatialstrates .movable-helpers';
```


## Container Helpers

The Container Helpers API provides helper functions to move a movable from one space into another.

### Import

```js
import { moveMovableToContainer } from '#Spatialstrates .container-helpers';
```
