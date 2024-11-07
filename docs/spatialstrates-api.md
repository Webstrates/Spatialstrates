# Spatialstrates API

## Dynamic Components

> [!WARNING] Outdated Documentation
> Some of the below documentation is slightly outdated and requires revision.

The `App` component is designed to be extensible. It includes a `DynamicComponents` component that dynamically renders other components from fragments with either of the following classes:

| Selector                   | Description                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| `.dynamic-gui-component`   | 2D GUI components that are rendered in the GUI of Spatialstrates.        |
| `.dynamic-scene-component` | 3D scene components that are rendered in the 3D scene of Spatialstrates. |

For each dynamic component the `App` component will attempt to render its `Main()` function. This function should be exported in the dynamic component like this:

```javascript
export function Main() {
    return <div>What to render in the scene or 2D GUI.</div>;
}
```


## Menu

TODO


## ControllerMenu

TODO
