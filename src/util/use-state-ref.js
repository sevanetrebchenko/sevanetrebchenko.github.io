import React, { useRef, useState } from 'react';

// Returns a reference to the state so that it can be used in a stale context.
export default function useStateRef(initialValue) {
    const [state, _setState] = useState(initialValue);
    const stateRef = useRef(state);

    const setState = (value) => {
        stateRef.current = value;
        _setState(value);
    };

    return [stateRef, setState];
}