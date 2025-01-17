import React from 'react';
const { useState } = React;



export function Main() {
    const [showDialog, setShowDialog] = useState(false);

    return <>
        <div className="spatialstrates-title" onClick={() => setShowDialog(!showDialog)}>
            <h1>Spatialstrates</h1>
        </div>
        {showDialog ? <div className="spatialstrates-dialog-modal" onClick={() => setShowDialog(false)}>
            <div className="spatialstrates-dialog" onClick={(e) => e.stopPropagation()}>
                <h2>Spatialstrates</h2>
                <p>Version 0.1.1 | <a href="https://github.com/Webstrates/Spatialstrates" target="_blank">GitHub</a></p>
            </div>
        </div> : null}
    </>;
}
