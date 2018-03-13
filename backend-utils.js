var utils = module.exports = {};

/*
*   Intended to get the percentile of a rank amongst all ranks.
*/

utils.percentileOfScore = function(array, value){
    const originalLength = array.length;
    const a = [...array];
    let alen;
    const equalsValue = v => v === value;

    if (!array.some(equalsValue)) {
        a.push(value);
        alen = range(a.length)
    } else {
        alen = range(a.length + 1)
    }
    const idx = array.map(equalsValue);
    const alenTrue = alen.filter((v) => idx[alen.indexOf(v)]);
    const meanVal = mean(alenTrue);
    const percent = meanVal / originalLength;
    return Math.round( percent * 100) / 100;
};