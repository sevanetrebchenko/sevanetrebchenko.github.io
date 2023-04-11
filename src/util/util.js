// Returns whether a className is present in the classNames of a given element.
export function hasClassName(element, className) {
    className = className.trim();
    const classNameString = element.className.trim();
    const classNames = classNameString.split(/\s+/g);

    return classNames.includes(className);
}

// Appends a className to the given element (provided the element isn't already tagged with that className). 
export function addClassName(element, className) {
    className = className.trim();
    if (className === '') {
        return;
    }

    const classNameString = element.className.trim();
    let classNames = [];

    if (classNameString !== '') {
        classNames = classNameString.split(/\s+/g);
    }

    if (!classNames.includes(className)) {
        classNames.push(className);
    }

    element.className = classNames.join(' ');
}

// Removes a className from the given element (provided the element is tagged with that className).
export function removeClassName(element, className) {
    className = className.trim();
    if (className === '') {
        return;
    }

    const classNameString = element.className.trim();
    if (classNameString === '') {
        return;
    }

    // Remove all instances of 'className' from the 'classNames' list.
    let classNames = classNameString.split(/\s+/g);
    while (true) {
        const index = classNames.indexOf(className);

        if (index > -1) {
            classNames.splice(index, 1);
        }
        else {
            break;
        }
    }

    if (classNames.length === 0) {
        // Empty className, remove entire 'class' HTML attribute to keep DOM clean.
        element.removeAttribute('class');
    }
    else {
        element.className = classNames.join(' ');
    }
}

export function toMilliseconds(seconds) {
    return seconds * 1000;
}

export function disableScrolling() {
    // Disable scrolling globally.
    addClassName(document.body, 'no-scroll');

    // Note: there should only be one 'main' container per page.
    const main = document.getElementsByTagName('main')[0];
    if (!main) {
        return;
    }

    // Apllying 'no-scroll' to the main page container adds padding equal to the width of the scrollbar, allowing elements of the 
    // main container to maintain the same relative positioning with the scrollbar disabled as they would be with the scrollbar enabled. 

    addClassName(main, 'no-scroll');
}

export function enableScrolling() {
    // Enable scrolling globally.
    removeClassName(document.body, 'no-scroll');

    // Note: there should only be one 'main' container per page.
    const main = document.getElementsByTagName('main')[0];
    if (!main) {
        return;
    }

    removeClassName(main, 'no-scroll');
}