// state.js - records and settings

import { loadRecords, saveRecords, loadSettings, saveSettings } from './storage.js';
import { validateImport } from './validators.js';

const defaultSettings = {
  baseCurrency: 'USD',
  otherCurrencies: [
    { code: 'EUR', rate: 0.92 },
    { code: 'GBP', rate: 0.79 }
  ],
  cap: 0,
  categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other']
};

function copyDefaults() {
  return JSON.parse(JSON.stringify(defaultSettings));
}

function buildSettings(saved) {
  const result = copyDefaults();
  if (!saved || typeof saved !== 'object') return result;

  if (typeof saved.baseCurrency === 'string') {
    result.baseCurrency = saved.baseCurrency;
  }
  if (Array.isArray(saved.otherCurrencies) && saved.otherCurrencies.length === 2) {
    result.otherCurrencies = saved.otherCurrencies;
  }
  if (typeof saved.cap === 'number' && saved.cap >= 0) {
    result.cap = saved.cap;
  }
  if (Array.isArray(saved.categories) && saved.categories.length > 0) {
    result.categories = saved.categories;
  }
  return result;
}

let settings = buildSettings(loadSettings());

let records = [];
const savedRecords = loadRecords();
if (savedRecords.length > 0) {
  const check = validateImport(savedRecords, settings.baseCurrency);
  if (check.ok) {
    records = check.records;
  }
}

export function getRecords() {
  return records;
}

export function getSettings() {
  return settings;
}

export function getCurrencyCodes() {
  return [
    settings.baseCurrency,
    settings.otherCurrencies[0].code,
    settings.otherCurrencies[1].code
  ];
}

export function convertToBase(amount, currency) {
  if (!currency || currency === settings.baseCurrency) {
    return amount;
  }
  for (const other of settings.otherCurrencies) {
    if (other.code === currency) {
      return amount / other.rate;
    }
  }
  return amount;
}

function makeId() {
  let highest = 0;
  for (const record of records) {
    const match = record.id.match(/(\d+)$/);
    if (match) {
      const number = Number(match[1]);
      if (number > highest) highest = number;
    }
  }
  return 'rec_' + String(highest + 1).padStart(4, '0');
}

export function addRecord(fields) {
  const now = new Date().toISOString();
  const record = {
    id: makeId(),
    description: fields.description,
    amount: fields.amount,
    currency: fields.currency,
    category: fields.category,
    date: fields.date,
    createdAt: now,
    updatedAt: now
  };
  records.push(record);
  saveRecords(records);
  return record;
}

export function updateRecord(id, fields) {
  for (const record of records) {
    if (record.id === id) {
      record.description = fields.description;
      record.amount = fields.amount;
      record.currency = fields.currency;
      record.category = fields.category;
      record.date = fields.date;
      record.updatedAt = new Date().toISOString();
      saveRecords(records);
      return record;
    }
  }
  return null;
}

export function deleteRecord(id) {
  records = records.filter(function (record) {
    return record.id !== id;
  });
  saveRecords(records);
}

export function replaceRecords(newRecords) {
  records = newRecords;
  saveRecords(records);
}

export function clearRecords() {
  records = [];
  saveRecords(records);
}

export function updateSettings(changes) {
  settings = Object.assign({}, settings, changes);
  saveSettings(settings);
}

export function sortRecords(list, sortKey) {
  const copy = list.slice();
  const parts = sortKey.split('-');
  const field = parts[0];
  const direction = parts[1];

  copy.sort(function (a, b) {
    let result = 0;

    if (field === 'date') {
      result = a.date.localeCompare(b.date);
    } else if (field === 'description') {
      result = a.description.localeCompare(b.description, undefined, { sensitivity: 'base' });
    } else if (field === 'amount') {
      result = convertToBase(a.amount, a.currency) - convertToBase(b.amount, b.currency);
    }

    if (direction === 'desc') {
      result = -result;
    }
    return result;
  });

  return copy;
}
