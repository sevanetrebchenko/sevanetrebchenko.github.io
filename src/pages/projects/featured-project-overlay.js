
import React, { useRef, useEffect } from 'react';

import { animationTimeInSeconds } from './featured-project-defines';
import './featured-project-overlay.css'
import '../body.css'
import { addClassName, disableScrolling, enableScrolling, hasClassName, removeClassName, toMilliseconds } from '../../util/util';


export default function FeaturedProjectOverlay(props) {
    const { project, unmountSelf } = props;
    const overlayRef = useRef(null);

    useEffect(() => {
        // Mounting.
        const overlay = overlayRef.current;

        function onClickOutside(e) {
            // Do not allow closing the featured project overlay while it is fading in.
            if (hasClassName(overlay, 'featured-project-overlay-opening')) {
                return;
            }

            if (!overlay.contains(e.target)) {
                addClassName(overlay, 'featured-project-overlay-closing');

                setTimeout(() => {
                    unmountSelf();
                }, toMilliseconds(animationTimeInSeconds));
            }
        }

        disableScrolling();
        addClassName(overlay, 'featured-project-overlay-opening');

        // Register event listener.
        document.body.addEventListener('mousedown', onClickOutside);

        setTimeout(() => {
            removeClassName(overlay, 'featured-project-overlay-opening');
        }, toMilliseconds(animationTimeInSeconds));

        return () => {
            // Unmounting.
            document.body.removeEventListener('mousedown', onClickOutside);
            enableScrolling();
        };
    }, []);

    return (
        <React.Fragment></React.Fragment>
    );
}