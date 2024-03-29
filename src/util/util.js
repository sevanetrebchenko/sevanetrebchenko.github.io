// Returns whether a className is present in the classNames of a given element.
export function hasClassName(element, className) {
    className = className.trim();
    return element.classList.contains(className.trim());
}

// Appends a className to the given element (provided the element isn't already tagged with that className). 
export function addClassName(element, className) {
    element.classList.add(className.trim());
}

// Removes a className from the given element (provided the element is tagged with that className).
export function removeClassName(element, className) {
    element.classList.remove(className.trim());
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