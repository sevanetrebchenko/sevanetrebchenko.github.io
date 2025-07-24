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

function useResponsiveBreakpoint() {
    const breakpoints = {
        mobile: 480,
        compact: 768,
        tablet: 1024,
        desktop: 1280,
        wide: 1536
    }

    const isMobile = useMediaQuery({ maxWidth: breakpoints.mobile - 1 });
    const isCompact = useMediaQuery({
        minWidth: breakpoints.mobile,
        maxWidth: breakpoints.compact - 1,
    });
    const isTablet = useMediaQuery({
        minWidth: breakpoints.compact,
        maxWidth: breakpoints.tablet - 1,
    });
    const isDesktop = useMediaQuery({
        minWidth: breakpoints.tablet,
        maxWidth: breakpoints.desktop - 1,
    });
    const isWide = useMediaQuery({
        minWidth: breakpoints.wide,
    })

    let label = "wide";
    if (isMobile) {
        label = "mobile";
    }
    else if (isCompact) {
        label = "compact";
    }
    else if (isTablet) {
        label = "tablet";
    }
    else if (isDesktop) {
        label = "desktop";
    }

    function atLeast(target) {
        return breakpoints[label] >= breakpoints[target];
    }
    function atMost(target) {
        return breakpoints[label] <= breakpoints[target];
    }

    return {
        label,
        isMobile,
        isCompact,
        isTablet,
        isDesktop,
        isWide,
        atLeast,
        atMost
    };
}

export { getPostUrl, sortByName, get, useResponsiveBreakpoint }