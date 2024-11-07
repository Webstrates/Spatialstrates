import React from 'react';
const { useEffect, useState, useRef } = React;
import { ErrorBoundary } from 'react-error-boundary';



function DynamicComponent({ fragment }) {
    const [component, setComponent] = useState(null);
    const boundaryRef = useRef(null);

    const updateComponent = async () => {
        if (!fragment) return;
        const module = await fragment.require();
        const Main = module['Main'];
        setComponent(<Main />);
        boundaryRef.current?.resetErrorBoundary();
    };

    useEffect(() => {
        fragment?.registerOnFragmentChangedHandler(updateComponent);
        updateComponent();

        return () => {
            fragment?.unRegisterOnFragmentChangedHandler(updateComponent);
        };
    }, [fragment]);

    return <ErrorBoundary ref={boundaryRef} fallback={null}>
        {component}
    </ErrorBoundary>;
};

// This is a component that dynamically loads components from fragments
export function DynamicComponents({ selector }) {
    const [output, setOutput] = useState([]);
    const fragmentsMap = useRef(new Map());

    useEffect(() => {
        if (!selector) return;
        const query = cQuery(document).liveQuery(selector, {
            added: async (fragmentElement) => {
                const fragment = Fragment.one(fragmentElement);
                if (!fragment) return;

                fragmentsMap.current.set(fragment.uuid, fragment);
                setOutput(Array.from(fragmentsMap.current.entries()));
            },
            removed: (fragmentElement) => {
                const fragment = Fragment.one(fragmentElement);
                if (!fragment) return;

                fragmentsMap.current.delete(fragment.uuid);
                setOutput(Array.from(fragmentsMap.current.entries()));
            }
        });
        return () => {
            query.stop();
        };
    }, []);

    return output.map((entry) => {
        const [id, fragment] = entry;
        return <DynamicComponent fragment={fragment} key={fragment.uuid} />;
    });
}
