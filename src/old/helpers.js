
function getPostUrl(title) {
    // Remove all non-word characters and replace all spaces with -
    return `/post/${title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s/g, '-')}`;
}

export {
    getPostUrl,
}