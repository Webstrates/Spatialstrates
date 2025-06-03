import React from 'react';



export function Dialog({ children, className, visible, setVisible }) {
    return visible ? <div className="dialog-modal" onClick={() => setVisible(false)}>
        <div className={`dialog${className ? ' ' + className : ''}`} onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    </div> : null;
}
