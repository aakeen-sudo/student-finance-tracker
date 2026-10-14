// main.js - starts the app and connects everything

import {
  getRecords, getSettings, getCurrencyCodes, convertToBase,
  addRecord, updateRecord, deleteRecord, replaceRecords, clearRecords,
  updateSettings, sortRecords
} from './state.js';
import {
  checkDescription, checkAmount, checkDate, checkCategory, checkCap,
  checkCurrencyCode, checkRate, validateRecordFields, validateImport, patterns
} from './validators.js';
import { compileRegex, filterRecords } from './search.js';
import {
  getTotal, getTopCategory, getLastSevenDays, getCapInfo, getCapMessage, getDateKey
} from './stats.js';
import { downloadJSON } from './storage.js';
import * as ui from './ui.js';

let editingId = null;
let newRowId = null;

function getStats() {
  const records = getRecords();
  const settings = getSettings();
  const total = getTotal(records);
  const capInfo = getCapInfo(total, settings.cap);

  return {
    count: records.length,
    total: total,
    top: getTopCategory(records),
    days: getLastSevenDays(records),
    capInfo: capInfo,
    capMessage: getCapMessage(capInfo, settings.baseCurrency),
    cap: settings.cap,
    base: settings.baseCurrency
  };
}

function refreshStats() {
  ui.renderStats(getStats());
}

function refreshRecords() {
  const allRecords = getRecords();
  const searchText = ui.byId('search-input').value;
  const ignoreCase = ui.byId('search-case').checked;
  const re = compileRegex(searchText, ignoreCase);

  const patternIsBad = searchText !== '' && re === null;

  let shown = allRecords;
  if (re) {
    shown = filterRecords(allRecords, re);
  }
  shown = sortRecords(shown, ui.byId('sort-select').value);

  if (patternIsBad) {
    ui.showSearchMessage('That is not a valid regex or it is too long. Showing all records.', true);
  } else if (re) {
    ui.showSearchMessage(shown.length + ' matches.', false);
  } else {
    ui.showSearchMessage('', false);
  }

  ui.renderRecords({
    shown: shown,
    total: allRecords.length,
    re: re,
    editingId: editingId,
    newId: newRowId,
    baseCurrency: getSettings().baseCurrency,
    convert: convertToBase
  });
}

function refreshSettingsParts() {
  const settings = getSettings();
  ui.fillCategoryList(settings.categories);
  ui.fillCurrencySelect(ui.byId('add-currency'), getCurrencyCodes());
  ui.fillSettingsForm(settings);
  ui.byId('cap-input').value = settings.cap > 0 ? String(settings.cap) : '';
}

function announceChange(message) {
  const stats = getStats();
  if (stats.capInfo.hasCap) {
    message = message + ' ' + stats.capMessage;
  }
  ui.showStatus(message, stats.capInfo.over > 0);
}

function handleHashChange() {
  const name = window.location.hash.slice(1);
  if (!ui.isViewName(name)) return;
  ui.showView(name, true);
}

const addChecks = {
  description: checkDescription,
  amount: checkAmount,
  category: checkCategory,
  date: checkDate
};

function handleAddSubmit(event) {
  event.preventDefault();

  const fields = ui.readAddForm();
  const errors = validateRecordFields(fields);

  let firstBad = null;
  for (const name of Object.keys(addChecks)) {
    ui.showFieldError('add-' + name, errors[name] || '');
    if (errors[name] && !firstBad) firstBad = name;
  }

  if (firstBad) {
    ui.showStatus('Please fix the errors in the form.');
    ui.byId('add-' + firstBad).focus();
    return;
  }

  const record = addRecord({
    description: fields.description,
    amount: Number(fields.amount),
    currency: fields.currency,
    category: fields.category,
    date: fields.date
  });

  newRowId = record.id;
  ui.resetAddForm(getDateKey(new Date()));
  refreshRecords();
  refreshStats();
  announceChange('Record added.');
  ui.byId('add-description').focus();
}

function saveEdit(id) {
  const fields = ui.readEditRow(id);
  const errors = validateRecordFields(fields);

  if (Object.keys(errors).length > 0) {
    ui.showRowErrors(id, errors);
    return;
  }

  updateRecord(id, {
    description: fields.description,
    amount: Number(fields.amount),
    currency: fields.currency,
    category: fields.category,
    date: fields.date
  });

  editingId = null;
  newRowId = null;
  refreshRecords();
  refreshStats();
  announceChange('Record updated.');
  ui.focusRowButton(id, 'edit');
}

function cancelEdit(id) {
  editingId = null;
  refreshRecords();
  ui.focusRowButton(id, 'edit');
}

async function askToDelete(id) {
  const record = getRecords().find(function (item) {
    return item.id === id;
  });
  if (!record) return;

  const yes = await ui.confirmDialog(
    'Delete "' + record.description + '"? This cannot be undone.',
    'Delete'
  );
  if (!yes) return;

  deleteRecord(id);
  if (editingId === id) editingId = null;
  refreshRecords();
  refreshStats();
  announceChange('Deleted "' + record.description + '".');
  ui.focusRecordsHeading();
}

function handleTableClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === 'edit') {
    editingId = id;
    newRowId = null;
    refreshRecords();
    ui.focusEditRow(id);
  } else if (action === 'save') {
    saveEdit(id);
  } else if (action === 'cancel') {
    cancelEdit(id);
  } else if (action === 'delete') {
    askToDelete(id);
  }
}

function handleTableKeydown(event) {
  const target = event.target;
  if (!target.classList.contains('edit-input')) return;

  const row = target.closest('tr');
  if (event.key === 'Escape') {
    event.preventDefault();
    cancelEdit(row.dataset.id);
  } else if (event.key === 'Enter' && target.tagName === 'INPUT') {
    event.preventDefault();
    saveEdit(row.dataset.id);
  }
}

function handleCapSubmit(event) {
  event.preventDefault();

  const text = ui.byId('cap-input').value.trim();
  const message = checkCap(text);
  ui.showFieldError('cap-input', message);

  if (message) {
    ui.byId('cap-input').focus();
    return;
  }

  updateSettings({ cap: text === '' ? 0 : Number(text) });
  refreshStats();
}

function parseCategories(text) {
  const names = text.split(',');
  const clean = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed !== '') clean.push(trimmed);
  }
  return clean;
}

function handleSettingsSubmit(event) {
  event.preventDefault();

  const form = ui.readSettingsForm();
  const problems = {};

  const baseError = checkCurrencyCode(form.base);
  if (baseError) problems['set-base'] = baseError;

  const code1Error = checkCurrencyCode(form.code1);
  if (code1Error) problems['set-code-1'] = code1Error;

  const code2Error = checkCurrencyCode(form.code2);
  if (code2Error) problems['set-code-2'] = code2Error;

  const rate1Error = checkRate(form.rate1);
  if (rate1Error) problems['set-rate-1'] = rate1Error;

  const rate2Error = checkRate(form.rate2);
  if (rate2Error) problems['set-rate-2'] = rate2Error;

  if (!problems['set-code-1'] && form.code1 === form.base) {
    problems['set-code-1'] = 'Must be different from the base currency.';
  }
  if (!problems['set-code-2'] && (form.code2 === form.base || form.code2 === form.code1)) {
    problems['set-code-2'] = 'Must be different from the other two currencies.';
  }

  const categories = parseCategories(form.categories);
  if (categories.length === 0) {
    problems['set-categories'] = 'Add at least one category.';
  } else {
    for (const name of categories) {
      if (!patterns.category.test(name)) {
        problems['set-categories'] = '"' + name + '" is not allowed. Use letters, spaces and hyphens only.';
        break;
      }
    }
  }

  const ids = ['set-base', 'set-code-1', 'set-rate-1', 'set-code-2', 'set-rate-2', 'set-categories'];
  let firstBad = null;
  for (const id of ids) {
    ui.showFieldError(id, problems[id] || '');
    if (problems[id] && !firstBad) firstBad = id;
  }

  if (firstBad) {
    ui.showStatus('Settings were not saved. Please fix the problems shown.');
    ui.byId(firstBad).focus();
    return;
  }

  updateSettings({
    baseCurrency: form.base,
    otherCurrencies: [
      { code: form.code1, rate: Number(form.rate1) },
      { code: form.code2, rate: Number(form.rate2) }
    ],
    categories: categories
  });

  refreshSettingsParts();
  refreshRecords();
  refreshStats();
  ui.showStatus('Settings saved.');
}

function report(lines, isError) {
  ui.showImportMessage(lines, isError);
  ui.showStatus(lines[0], isError);
}

async function importRecords(data, sourceName) {
  const result = validateImport(data, getSettings().baseCurrency);

  if (!result.ok) {
    const lines = ['Import stopped. Nothing was changed.'];
    const firstFive = result.problems.slice(0, 5);
    for (const problem of firstFive) lines.push(problem);
    if (result.problems.length > 5) {
      lines.push('And ' + (result.problems.length - 5) + ' more problems.');
    }
    report(lines, true);
    return;
  }

  const current = getRecords().length;
  if (current > 0) {
    const yes = await ui.confirmDialog(
      'Replace your ' + current + ' records with ' + result.records.length + ' records from ' + sourceName + '?',
      'Replace'
    );
    if (!yes) {
      report(['Import cancelled. Nothing was changed.'], false);
      return;
    }
  }

  replaceRecords(result.records);
  editingId = null;
  newRowId = null;
  refreshRecords();
  refreshStats();
  report(['Imported ' + result.records.length + ' records from ' + sourceName + '.'], false);
}

async function handleImportFile(event) {
  const input = event.target;
  const file = input.files[0];
  if (!file) return;

  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (error) {
    report(['That file is not valid JSON. Nothing was changed.'], true);
    input.value = '';
    return;
  }

  await importRecords(data, 'your file');
  input.value = '';
}

async function loadSampleData() {
  try {
    const response = await fetch('seed.json');
    if (!response.ok) throw new Error('seed.json not found');
    const data = await response.json();
    await importRecords(data, 'the sample data');
  } catch (error) {
    report(['Could not load seed.json. Open the app from GitHub Pages or a local server.'], true);
  }
}

function handleExport() {
  const records = getRecords();
  if (records.length === 0) {
    report(['There is nothing to export yet.'], true);
    return;
  }
  downloadJSON('finance-records-' + getDateKey(new Date()) + '.json', records);
  report(['Exported ' + records.length + ' records.'], false);
}

async function handleClearAll() {
  const count = getRecords().length;
  if (count === 0) {
    report(['There are no records to delete.'], false);
    return;
  }
  const yes = await ui.confirmDialog(
    'Delete all ' + count + ' records? This cannot be undone.',
    'Delete all'
  );
  if (!yes) return;

  clearRecords();
  editingId = null;
  newRowId = null;
  refreshRecords();
  refreshStats();
  report(['All records deleted.'], false);
}

function setUpEvents() {
  window.addEventListener('hashchange', handleHashChange);

  for (const name of Object.keys(addChecks)) {
    ui.byId('add-' + name).addEventListener('input', function () {
      const message = addChecks[name](ui.byId('add-' + name).value);
      ui.showFieldError('add-' + name, message);
    });
  }
  ui.byId('add-form').addEventListener('submit', handleAddSubmit);
  ui.byId('clear-form').addEventListener('click', function () {
    ui.resetAddForm(getDateKey(new Date()));
    ui.byId('add-description').focus();
  });

  ui.byId('search-input').addEventListener('input', refreshRecords);
  ui.byId('search-case').addEventListener('change', refreshRecords);
  ui.byId('sort-select').addEventListener('change', refreshRecords);

  for (const button of document.querySelectorAll('[data-pattern]')) {
    button.addEventListener('click', function () {
      ui.byId('search-input').value = button.dataset.pattern;
      refreshRecords();
      ui.byId('search-input').focus();
    });
  }

  ui.byId('records-body').addEventListener('click', handleTableClick);
  ui.byId('records-body').addEventListener('keydown', handleTableKeydown);

  ui.byId('cap-form').addEventListener('submit', handleCapSubmit);
  ui.byId('settings-form').addEventListener('submit', handleSettingsSubmit);

  ui.byId('export-button').addEventListener('click', handleExport);
  ui.byId('import-file').addEventListener('change', handleImportFile);
  ui.byId('load-sample').addEventListener('click', loadSampleData);
  ui.byId('load-sample-empty').addEventListener('click', loadSampleData);
  ui.byId('clear-button').addEventListener('click', handleClearAll);
}

function start() {
  refreshSettingsParts();
  ui.resetAddForm(getDateKey(new Date()));
  refreshRecords();
  refreshStats();
  setUpEvents();

  const firstView = window.location.hash.slice(1);
  ui.showView(ui.isViewName(firstView) ? firstView : 'dashboard', false);
}

start();
