import React from 'react';
import { Text as TextDrei } from '@react-three/drei';



// https://www.cdnfonts.com/
// Inter: https://fonts.cdnfonts.com/s/19795/Inter-Medium.woff
// Poppins: https://fonts.cdnfonts.com/s/16009/Poppins-Medium.woff



// Set Global Properties for the Text Component
export function Text(props) {
    const { children, ...rest } = props;
    return (
        <TextDrei
            font="inter-medium.woff"
            {...rest}>
            {children}
        </TextDrei>
    );
}
