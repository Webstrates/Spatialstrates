import React from 'react';
const { useState } = React;
import { useProperty } from '#VarvReact';

import { Dialog } from '#Dialog .default';



export function Main() {
    const [visible, setVisible] = useState(false);
    const [xrPlatform] = useProperty('xrPlatform');

    return <>
        <div className="spatialstrates-title" onClick={() => setVisible(!visible)}>
            <img src="spatialstrates-icons.zip/icon_128.png" />
            <h1>Spatialstrates</h1>
        </div>

        <Dialog visible={visible} setVisible={setVisible}>
            <h2>Spatialstrates</h2>
            <p>Version 0.3.0 | <a href="https://github.com/Webstrates/Spatialstrates" target="_blank">GitHub</a></p>
            <p>XR Platform: {xrPlatform}</p>
        </Dialog>
    </>;
}
