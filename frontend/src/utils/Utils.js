export function convertToHideText(text) {
  const textArray = text.split(' ');
  const character = '@7a8b9c';
  return textArray.map(i => {
    if (i.indexOf(character) !== -1) {
      return '<span class="">' + i + '</span>';
    }
    return i;
  }).join(' ');
}
