// search.js - regex search and highlight

export function compileRegex(input, ignoreCase) {
  if (!input) return null;
  if (input.length > 100) return null;

  try {
    return new RegExp(input, ignoreCase ? 'i' : '');
  } catch (error) {
    return null;
  }
}

export function recordMatches(record, re) {
  const parts = [
    record.description,
    record.category,
    record.date,
    record.amount.toFixed(2)
  ];
  for (const text of parts) {
    if (re.test(text)) {
      return true;
    }
  }
  return false;
}

export function filterRecords(records, re) {
  if (!re) return records;
  return records.filter(function (record) {
    return recordMatches(record, re);
  });
}

export function highlight(text, re) {
  const fragment = document.createDocumentFragment();

  if (!re) {
    fragment.append(text);
    return fragment;
  }

  const globalRe = new RegExp(re.source, re.flags + 'g');
  let lastIndex = 0;

  for (const match of text.matchAll(globalRe)) {
    if (match[0] === '') continue;

    fragment.append(text.slice(lastIndex, match.index));

    const mark = document.createElement('mark');
    mark.textContent = match[0];
    fragment.append(mark);

    lastIndex = match.index + match[0].length;
  }

  fragment.append(text.slice(lastIndex));
  return fragment;
}
