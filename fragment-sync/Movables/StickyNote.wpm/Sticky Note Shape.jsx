import React from 'react';
const { useEffect, useRef } = React;
import { HTMLContainer, stopEventPropagation } from 'tldraw';
import { useProperty } from '#VarvReact';

import { MovableShapeUtil, MovableVarvScope } from '#Spatialstrates .movable-shape';
import { CANVAS_SCALE } from '#Spatialstrates .projection-helpers';



function StickyNoteShape({ shape, isEditing }) {
    const [selected] = useProperty('selected');
    const [text, setText] = useProperty('text');
    const [color, setColor] = useProperty('color');
    const textAreaRef = useRef(null);
    const cursorRef = useRef(0);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.selectionStart = cursorRef.current;
            textAreaRef.current.selectionEnd = cursorRef.current;
        }
    }, [text]);

    return <HTMLContainer
        className={`sticky-note-shape color-${color || 'yellow'}`}
        title="Sticky Note"
        style={{
            transform: 'translate(-50%, -50%)',
            width: shape.props.w + 'px',
            height: shape.props.h + 'px',
            pointerEvents: isEditing ? 'all' : 'none',
            borderRadius: '8px',
            boxShadow: 'rgba(100, 100, 111, 0.4) 0px 0px 4px 0px',
            padding: '4px',
            fontSize: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
        }}>
        {isEditing ? <textarea
            ref={textAreaRef}
            title="Edit text"
            value={text}
            onChange={e => {
                cursorRef.current = e.target.selectionStart;
                setText(e.target.value);
            }}
            style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                pointerEvents: 'all',
                backgroundColor: 'transparent',
                fontFamily: 'sans-serif',
                fontSize: 'inherit',
                padding: 0
            }}
            onPointerDown={stopEventPropagation}
            onPointerMove={stopEventPropagation}
        /> : text}
        {selected ? <div className="sticky-note-color-selectors" onPointerDown={stopEventPropagation}>
            <div className="sticky-note-color-selector color-yellow" title="Yellow" onClick={() => setColor('yellow')}></div>
            <div className="sticky-note-color-selector color-red" title="Red" onClick={() => setColor('red')}></div>
            <div className="sticky-note-color-selector color-green" title="Green" onClick={() => setColor('green')}></div>
            <div className="sticky-note-color-selector color-blue" title="Blue" onClick={() => setColor('blue')}></div>
            <div className="sticky-note-color-selector color-purple" title="Purple" onClick={() => setColor('purple')}></div>
            <div className="sticky-note-color-selector color-orange" title="Orange" onClick={() => setColor('orange')}></div>
            <div className="sticky-note-color-selector color-pink" title="Pink" onClick={() => setColor('pink')}></div>
        </div> : null}
    </HTMLContainer>;
}

class StickyNoteShapeUtil extends MovableShapeUtil {
    static type = 'StickyNote';

    canEdit = () => true;

    getDefaultProps() {
        return Object.assign(super.getDefaultProps(), {
            w: CANVAS_SCALE * 0.15,
            h: CANVAS_SCALE * 0.15
        });
    }

    component(shape) {
        const isEditing = this.editor.getEditingShapeId() === shape.id;

        return <MovableVarvScope shape={shape}>
            <StickyNoteShape shape={shape} isEditing={isEditing} />
        </MovableVarvScope>;
    }
}

export const Main = StickyNoteShapeUtil;
