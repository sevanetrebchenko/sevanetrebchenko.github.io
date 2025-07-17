import {useMediaQuery} from "react-responsive";

function getPostUrl(title) {
    // Remove all non-word characters and replace all spaces with -
    return `/post/${title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s/g, '-')}`;
}

function sortByName(list) {
    return list.sort((a, b) => a.localeCompare(b))
}

async function get(url) {
    return fetch(url, {
        method: "GET",
        cache: "reload",
        headers: {
            'Accept': "text/plain",
            'Content-Type': "text/plain",
        }
    }).then(response => {
        if (!response.ok) {
            console.error(`Error loading URL ${url}: ${response.statusText}`);
            return null;
        }

        return response.text();
    });
}

function getResponsiveClassName(classNames, isMobile, isTablet) {
    classNames = classNames.split(" ");
    if (isMobile) {
        classNames.push("mobile");
    }
    else if (isTablet) {
        classNames.push("tablet");
    }
    return classNames.join(" ");
}

const mobileDisplayWidthThreshold = 480;
const tabletDisplayWidthThreshold = 1280;

export { getPostUrl, sortByName, get, getResponsiveClassName, mobileDisplayWidthThreshold, tabletDisplayWidthThreshold }