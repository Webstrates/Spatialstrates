import React from 'react';
const { useState, useMemo } = React;
import { Tldraw } from 'tldraw';
import { Varv } from '#VarvReact';

import { DynamicComponents } from '#Spatialstrates .dynamic-components';
import { SelectedHoveredDetector } from '#Spatialstrates .canvas-view .selected-hovered-detector';
import { DragDetector } from '#Spatialstrates .canvas-view .drag-detector';
import { ColorForwarder } from '#Spatialstrates .canvas-view .color-forwarder';
import { TitleText } from '#Spatialstrates .canvas-view .title-text';
import { BoundaryPreview } from '#Spatialstrates .canvas-view .boundary-preview';
import { MovableCanvasController } from '#Spatialstrates .movable-canvas-controller';



export function CanvasView({ shapeUtils }) {
    const [color, setColor] = useState('');

    const tldraw = useMemo(() => (
        <Tldraw key={Math.random()} // Prevent dynamic components to use an old editor
            shapeUtils={shapeUtils}
            components={{
                ContextMenu: null,
                ActionsMenu: null,
                HelpMenu: null,
                // ZoomMenu: null,
                MainMenu: null,
                // Minimap: null,
                StylePanel: null,
                PageMenu: null,
                // NavigationPanel: null,
                // Toolbar: null,
                KeyboardShortcutsDialog: null,
                QuickActions: null,
                // HelperButtons: null,
                DebugPanel: null,
                DebugMenu: null,
                SharePanel: null,
                // MenuPanel: null,
                // TopPanel: null,
                // CursorChatBubble: null,
                // RichTextToolbar: null,
                // Dialogs: null,
                // Toasts: null
            }}
            overrides={{
                // Disable the default keyboard shortcuts
                tools(_app, tools) {
                    const newTools = {};
                    for (const key in tools) {
                        newTools[key] = { ...tools[key], kbd: 'ctrl+shift+alt+meta+0' };
                    }
                    return newTools;
                },
                actions(_app, actions) {
                    const newActions = {};
                    for (const key in actions) {
                        newActions[key] = { ...actions[key], kbd: 'ctrl+shift+alt+meta+0' };
                    }
                    return newActions;
                },
            }}
            options={{ maxPages: 1 }}
            onMount={(editor) => {
                window.tldrawEditor = editor;
                setTimeout(() => {
                    editor.zoomToFit();
                    editor.resetZoom();
                }, 100);
            }}>

            <SelectedHoveredDetector />
            <DragDetector />
            <DynamicComponents selector=".dynamic-canvas-component" />

            <Varv property="locationHash">
                <TitleText />
                <BoundaryPreview />
                <ColorForwarder setColor={setColor} />
                <Varv property="movables">
                    <MovableCanvasController />
                </Varv>
            </Varv>
        </Tldraw>
    ), [shapeUtils]);

    return <div className={`tldraw-canvas color-${color || 'default'}`}>
        {tldraw}
    </div>;
}
