import React from 'react';
import { HTMLContainer, Rectangle2d, BaseBoxShapeUtil, T } from 'tldraw';
import { Varv, useProperty } from '#VarvReact';

import { CANVAS_SCALE } from '#Spatialstrates .projection-helpers';
import { MovableVarvScope } from '#Spatialstrates .movable-shape';



let AudioStream;
if (Fragment.one('#AudioStream .default')) {
    const audioStreamModule = await Fragment.one('#AudioStream .default').require();
    AudioStream = audioStreamModule.AudioStream;
}



function AvatarShape({ shape }) {
    const [userName] = useProperty('userName');
    const [client] = useProperty('client');
    const [view] = useProperty('view');
    const [type] = useProperty('type');

    return <>
        {AudioStream ? <Varv property="clientAudioStream">
            <AudioStream client={client} />
        </Varv> : null}
        {view === '3D' ? (
            <HTMLContainer
                className={`avatar-shape type-${type || ''}`}
                style={{
                    transform: 'translate(-50%, -50%)',
                    width: shape.props.w + 'px',
                    height: shape.props.h + 'px'
                }}
            >
                <div className="user-name">{userName}</div>
                <div className={`icon type-${type}`} />
            </HTMLContainer>
        ) : null}
        {type === 'cursor' ? (
            <HTMLContainer
                className={`avatar-shape type-${type || ''}`}
                style={{
                    position: 'relative',
                    transform: 'translate(-50%, -50%)',
                    width: shape.props.w + 'px',
                    height: shape.props.h + 'px',
                }}
            >
                {/* Vertical Line */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    transform: 'translateX(-50%)',
                    width: '2px',
                    height: '100%',
                    backgroundColor: 'skyblue'
                }} />
                {/* Horizontal Line */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    transform: 'translateY(-50%)',
                    width: '100%',
                    height: '2px',
                    backgroundColor: 'skyblue'
                }} />
                {/* Center Dot */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'skyblue',
                    transform: 'translate(-50%, -50%)'
                }} />
                <div className="user-name" style={{
                    position: 'absolute',
                    top: '4px'
                }}>
                    {userName}
                </div>
            </HTMLContainer>
        ) : null}
    </>;
}

export class AvatarShapeUtil extends BaseBoxShapeUtil {
    static type = 'Avatar';
    static props = {
        conceptUUID: T.string,
        conceptType: T.string,
        avatarType: T.string,
        w: T.number,
        h: T.number,
        zIndex: T.number
    };

    getDefaultProps() {
        return {
            conceptUUID: false,
            conceptType: false,
            avatarType: false,
            w: CANVAS_SCALE * 0.1,
            h: CANVAS_SCALE * 0.1,
            zIndex: 0
        };
    }

    canBind = () => true;
    canCrop = () => false;
    canEdit = () => false;
    canResize = () => false;
    canScroll = () => false;
    canSnap = () => false;
    isAspectRatioLocked = () => true;
    hideRotateHandle = () => true;

    getGeometry(shape) {
        return new Rectangle2d({
            x: -shape.props.w / 2,
            y: -shape.props.h / 2,
            width: shape.props.w,
            height: shape.props.h,
            isFilled: true,
        });
    }

    indicator(shape) {
        return <rect
            x={-shape.props.w / 2}
            y={-shape.props.h / 2}
            width={shape.props.w}
            height={shape.props.h}
        />;
    }

    component(shape) {
        return <MovableVarvScope shape={shape}>
            <AvatarShape shape={shape} />
        </MovableVarvScope>;
    }
}

export const Main = AvatarShapeUtil;
