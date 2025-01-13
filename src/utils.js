
function getPostUrl(title) {
    // Remove all non-word characters and replace all spaces with -
    return `/post/${title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s/g, '-')}`;
}

function sortByName(list) {
    return list.sort((a, b) => a.localeCompare(b))
}

export { getPostUrl, sortByName }