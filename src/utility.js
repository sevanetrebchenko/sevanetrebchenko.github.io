
// Takes date string (MM-DD-YYYY) and returns date object:
// { day, month, year }
function getDateObject(date) {
    const split = date.split('-');

    return {
        day: parseInt(split[1]),
        month: parseInt(split[0]),
        year: parseInt(split[2])
    };
}

export { getDateObject };