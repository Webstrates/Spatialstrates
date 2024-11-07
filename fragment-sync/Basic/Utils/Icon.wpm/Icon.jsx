import React from 'react';
import { Clone } from '@react-three/drei';



export const SELECTED_COLOR_PRIMARY = 'hsl(14, 100%, 50%)';
export const SELECTED_COLOR_SECONDARY = 'hsl(26, 100%, 60%)';
export const HOVERED_SELECTED_COLOR_PRIMARY = 'hsl(14, 100%, 65%)';
export const HOVERED_SELECTED_COLOR_SECONDARY = 'hsl(26, 100%, 75%)';



export const themes = {
    '': { primary: 'rgb(255,0,255)', secondary: 'rgb(255,255,0)' },
    ':hovered': { primary: 'rgb(255,0,0)', secondary: 'rgb(255,0,0)' },
    ':selected': { primary: 'rgb(0,255,0)', secondary: 'rgb(255,0,0)' },
    ':selected:hovered': { primary: 'rgb(0,255,255)', secondary: 'rgb(255,0,0)' }
};



export function Icon(props) {
    const { model, theme = '', themesOverride = false } = props;
    if (model == null) return null;

    const finalThemes = themesOverride || themes;

    try {
        if (model.materials['Primary']) model.materials['Primary'].color.set(finalThemes[theme].primary);
        if (model.materials['Secondary']) model.materials['Secondary'].color.set(finalThemes[theme].secondary);
    } catch (ex) {
        console.log('Missing colour for ' + theme);
    }

    return <group {...props}>
        <Clone object={model ? model.scene : null} deep={'materialsOnly'} />
    </group>;
}
