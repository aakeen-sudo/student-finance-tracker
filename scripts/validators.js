// validators.js - all the regex rules

export const patterns = {
  // no space at the start or end
  noEdgeSpaces: /^\S(?:.*\S)?$/,
  // two or more spaces in a row
  doubleSpaces: /\s{2,}/,
  // 0 or a number with up to 2 decimals
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  // YYYY-MM-DD
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  // letters, with single spaces or hyphens between words
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  // same word twice in a row (back-reference)
  duplicateWord: /\b(\w+)\s+\1\b/i,
  // at least one letter (lookahead)
  hasLetter: /^(?=.*\p{L}).+$/u,
  // 3 capital letters
  currencyCode: /^[A-Z]{3}$/,
  // above zero, up to 4 decimals (negative lookahead blocks 0 and 0.00)
  rate: /^(?!0+(?:\.0+)?$)(?:0|[1-9]\d*)(?:\.\d{1,4})?$/
};

export function isRealDate(text) {
  const parts = text.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function checkDescription(text) {
  if (text.trim() === '') {
    return 'Description is required.';
  }
  if (!patterns.noEdgeSpaces.test(text)) {
    return 'Remove the spaces at the start or end.';
  }
  if (patterns.doubleSpaces.test(text)) {
    return 'Use only one space between words.';
  }
  if (!patterns.hasLetter.test(text)) {
    return 'Description needs at least one letter.';
  }
  if (patterns.duplicateWord.test(text)) {
    return 'A word is repeated twice in a row.';
  }
  return '';
}

export function checkAmount(text) {
  if (text === '') {
    return 'Amount is required.';
  }
  if (!patterns.amount.test(text)) {
    return 'Enter a number like 12 or 12.50 with up to 2 decimals.';
  }
  return '';
}

export function checkDate(text) {
  if (text === '') {
    return 'Date is required.';
  }
  if (!patterns.date.test(text)) {
    return 'Use the format YYYY-MM-DD, for example 2026-10-13.';
  }
  if (!isRealDate(text)) {
    return 'That date does not exist on the calendar.';
  }
  return '';
}

export function checkCategory(text) {
  if (text === '') {
    return 'Category is required.';
  }
  if (!patterns.category.test(text)) {
    return 'Use letters, spaces and hyphens only.';
  }
  return '';
}

export function checkCap(text) {
  if (text === '') {
    return '';
  }
  if (!patterns.amount.test(text)) {
    return 'Enter a number like 300 or leave it empty.';
  }
  return '';
}

export function checkCurrencyCode(text) {
  if (!patterns.currencyCode.test(text)) {
    return 'Use 3 capital letters, like USD.';
  }
  return '';
}

export function checkRate(text) {
  if (!patterns.rate.test(text)) {
    return 'Enter a number above 0, like 0.92.';
  }
  return '';
}

export function validateRecordFields(fields) {
  const errors = {};

  const descriptionError = checkDescription(fields.description);
  if (descriptionError) errors.description = descriptionError;

  const amountError = checkAmount(fields.amount);
  if (amountError) errors.amount = amountError;

  const categoryError = checkCategory(fields.category);
  if (categoryError) errors.category = categoryError;

  const dateError = checkDate(fields.date);
  if (dateError) errors.date = dateError;

  return errors;
}

export function validateImport(data, baseCurrency) {
  if (!Array.isArray(data)) {
    return { ok: false, problems: ['The file must be a list of records.'], records: [] };
  }
  if (data.length === 0) {
    return { ok: false, problems: ['The file has no records in it.'], records: [] };
  }

  const problems = [];
  const seenIds = new Set();

  data.forEach(function (item, index) {
    const label = 'Record ' + (index + 1) + ': ';

    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      problems.push(label + 'must be an object.');
      return;
    }

    if (typeof item.id !== 'string' || item.id.trim() === '') {
      problems.push(label + 'needs an id.');
    } else if (seenIds.has(item.id)) {
      problems.push(label + 'the id "' + item.id + '" is used more than once.');
    } else {
      seenIds.add(item.id);
    }

    if (typeof item.description !== 'string' || item.description.trim() === '') {
      problems.push(label + 'needs a description.');
    }

    if (typeof item.amount !== 'number' || !Number.isFinite(item.amount) || item.amount < 0) {
      problems.push(label + 'amount must be a number that is 0 or more.');
    }

    if (typeof item.category !== 'string' || !patterns.category.test(item.category)) {
      problems.push(label + 'category must use letters, spaces or hyphens only.');
    }

    if (typeof item.date !== 'string' || !patterns.date.test(item.date) || !isRealDate(item.date)) {
      problems.push(label + 'date must be a real date like 2026-10-13.');
    }

    if (typeof item.createdAt !== 'string' || typeof item.updatedAt !== 'string') {
      problems.push(label + 'needs createdAt and updatedAt.');
    }

    if (item.currency !== undefined &&
        (typeof item.currency !== 'string' || !patterns.currencyCode.test(item.currency))) {
      problems.push(label + 'currency must be a 3-letter code like USD.');
    }
  });

  if (problems.length > 0) {
    return { ok: false, problems: problems, records: [] };
  }

  const records = data.map(function (item) {
    return {
      id: item.id,
      description: item.description,
      amount: Math.round(item.amount * 100) / 100,
      currency: item.currency || baseCurrency,
      category: item.category,
      date: item.date,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  });

  return { ok: true, problems: [], records: records };
}
