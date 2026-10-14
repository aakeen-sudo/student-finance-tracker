// ui.js - everything that touches the page

import { highlight } from './search.js';
import { getCurrencyCodes } from './state.js';

export function byId(id) {
  return document.getElementById(id);
}

export function formatMoney(amount, code) {
  return amount.toFixed(2) + ' ' + code;
}

let messageTimer = null;

export function showStatus(message, urgent) {
  const statusBox = byId('status');
  const alertBox = byId('alert');

  statusBox.textContent = '';
  alertBox.textContent = '';
  clearTimeout(messageTimer);

  messageTimer = setTimeout(function () {
    if (urgent) {
      alertBox.textContent = message;
    } else {
      statusBox.textContent = message;
    }
  }, 60);
}

function setText(element, text) {
  if (element.textContent !== text) {
    element.textContent = text;
  }
}

export function showFieldError(inputId, message) {
  const input = byId(inputId);
  const error = byId(inputId + '-error');
  error.textContent = message;
  if (message) {
    input.setAttribute('aria-invalid', 'true');
  } else {
    input.removeAttribute('aria-invalid');
  }
}

const viewNames = ['about', 'dashboard', 'records', 'add', 'settings'];
const viewTitles = {
  about: 'About',
  dashboard: 'Dashboard',
  records: 'Records',
  add: 'Add a record',
  settings: 'Settings'
};

export function isViewName(name) {
  return viewNames.includes(name);
}

export function showView(name, moveFocus) {
  for (const viewName of viewNames) {
    byId('view-' + viewName).hidden = viewName !== name;
  }

  const links = document.querySelectorAll('.nav-list a');
  for (const link of links) {
    if (link.dataset.view === name) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }

  document.title = viewTitles[name];

  if (moveFocus) {
    byId(name + '-heading').focus();
  }
}

export function focusRecordsHeading() {
  byId('records-heading').focus();
}

export function confirmDialog(message, confirmLabel) {
  const dialog = byId('confirm-dialog');
  byId('confirm-message').textContent = message;
  byId('confirm-yes').textContent = confirmLabel;
  dialog.returnValue = '';

  return new Promise(function (resolve) {
    dialog.addEventListener('close', function () {
      resolve(dialog.returnValue === 'yes');
    }, { once: true });
    dialog.showModal();
  });
}

function makeCell(label, content) {
  const cell = document.createElement('td');
  if (label) {
    cell.dataset.label = label;
  }
  cell.append(content);
  return cell;
}

function makeButton(text, action, id, description) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button small';
  if (action === 'delete') button.classList.add('danger');
  if (action === 'edit' || action === 'cancel') button.classList.add('secondary');
  button.textContent = text;
  button.dataset.action = action;
  button.dataset.id = id;
  if (description) {
    button.setAttribute('aria-label', text + ': ' + description);
  }
  return button;
}

function makeInput(name, value, label) {
  const input = document.createElement('input');
  input.type = 'text';
  input.name = name;
  input.value = value;
  input.className = 'edit-input';
  input.setAttribute('aria-label', label);
  input.autocomplete = 'off';
  return input;
}

function buildRow(record, options) {
  const row = document.createElement('tr');
  row.dataset.id = record.id;
  if (record.id === options.newId) {
    row.classList.add('new-row');
  }

  row.append(makeCell('Date', highlight(record.date, options.re)));
  row.append(makeCell('Description', highlight(record.description, options.re)));
  row.append(makeCell('Category', highlight(record.category, options.re)));

  const amount = document.createElement('span');
  amount.className = 'amount';
  amount.append(highlight(record.amount.toFixed(2), options.re));
  amount.append(' ' + record.currency);

  if (record.currency !== options.baseCurrency) {
    const small = document.createElement('small');
    small.className = 'converted';
    small.textContent = 'about ' + formatMoney(options.convert(record.amount, record.currency), options.baseCurrency);
    amount.append(small);
  }
  row.append(makeCell('Amount', amount));

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.append(makeButton('Edit', 'edit', record.id, record.description));
  actions.append(makeButton('Delete', 'delete', record.id, record.description));
  row.append(makeCell('', actions));

  return row;
}

function buildEditRow(record) {
  const row = document.createElement('tr');
  row.dataset.id = record.id;
  row.classList.add('editing-row');

  row.append(makeCell('Date', makeInput('date', record.date, 'Date (YYYY-MM-DD)')));
  row.append(makeCell('Description', makeInput('description', record.description, 'Description')));

  const categoryInput = makeInput('category', record.category, 'Category');
  categoryInput.setAttribute('list', 'category-list');
  row.append(makeCell('Category', categoryInput));

  const amountWrap = document.createElement('div');
  amountWrap.className = 'amount-edit';
  amountWrap.append(makeInput('amount', record.amount.toFixed(2), 'Amount'));

  const select = document.createElement('select');
  select.name = 'currency';
  select.className = 'edit-input';
  select.setAttribute('aria-label', 'Currency');
  const codes = getCurrencyCodes();
  if (!codes.includes(record.currency)) {
    codes.push(record.currency);
  }
  fillCurrencySelect(select, codes, record.currency);
  amountWrap.append(select);
  row.append(makeCell('Amount', amountWrap));

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.append(makeButton('Save', 'save', record.id, ''));
  actions.append(makeButton('Cancel', 'cancel', record.id, ''));

  const errors = document.createElement('div');
  errors.className = 'row-errors';
  errors.setAttribute('role', 'alert');

  const actionsCell = makeCell('', actions);
  actionsCell.append(errors);
  row.append(actionsCell);

  return row;
}

export function renderRecords(options) {
  const body = byId('records-body');
  const table = byId('records-table');
  const emptyBox = byId('records-empty');

  body.textContent = '';

  byId('records-count').textContent =
    'Showing ' + options.shown.length + ' of ' + options.total + ' records.';

  if (options.total === 0) {
    table.hidden = true;
    emptyBox.hidden = false;
    byId('records-empty-text').textContent =
      'You have no records yet. Add your first one, or load the sample data to try the app.';
    byId('records-empty-actions').hidden = false;
    return;
  }

  if (options.shown.length === 0) {
    table.hidden = true;
    emptyBox.hidden = false;
    byId('records-empty-text').textContent =
      'No records match your search. Try a different pattern or clear the search box.';
    byId('records-empty-actions').hidden = true;
    return;
  }

  emptyBox.hidden = true;
  table.hidden = false;

  for (const record of options.shown) {
    if (record.id === options.editingId) {
      body.append(buildEditRow(record));
    } else {
      body.append(buildRow(record, options));
    }
  }
}

export function showSearchMessage(text, isBad) {
  setText(byId('search-message'), text);
  const input = byId('search-input');
  if (isBad) {
    input.setAttribute('aria-invalid', 'true');
  } else {
    input.removeAttribute('aria-invalid');
  }
}

function findRow(id) {
  for (const row of byId('records-body').children) {
    if (row.dataset.id === id) return row;
  }
  return null;
}

export function readEditRow(id) {
  const row = findRow(id);
  return {
    date: row.querySelector('[name="date"]').value,
    description: row.querySelector('[name="description"]').value,
    category: row.querySelector('[name="category"]').value,
    amount: row.querySelector('[name="amount"]').value,
    currency: row.querySelector('[name="currency"]').value
  };
}

export function showRowErrors(id, errors) {
  const row = findRow(id);
  const inputs = row.querySelectorAll('.edit-input');
  let firstBad = null;

  for (const input of inputs) {
    if (errors[input.name]) {
      input.setAttribute('aria-invalid', 'true');
      if (!firstBad) firstBad = input;
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  const messages = [];
  for (const name in errors) {
    messages.push(errors[name]);
  }
  row.querySelector('.row-errors').textContent = messages.join(' ');

  if (firstBad) firstBad.focus();
}

export function focusEditRow(id) {
  const row = findRow(id);
  if (row) row.querySelector('[name="description"]').focus();
}

export function focusRowButton(id, action) {
  const row = findRow(id);
  const button = row ? row.querySelector('[data-action="' + action + '"]') : null;
  if (button) {
    button.focus();
  } else {
    focusRecordsHeading();
  }
}

function renderTrend(days, baseCode) {
  const list = byId('trend-list');
  list.textContent = '';

  let biggest = 0;
  for (const day of days) {
    if (day.total > biggest) biggest = day.total;
  }

  byId('trend-empty').hidden = biggest > 0;
  if (biggest === 0) return;

  for (const day of days) {
    const item = document.createElement('li');

    const label = document.createElement('span');
    label.className = 'trend-label';
    label.textContent = day.label;

    const track = document.createElement('div');
    track.className = 'trend-track';
    track.setAttribute('aria-hidden', 'true');

    const fill = document.createElement('div');
    fill.className = 'trend-fill';
    let percent = Math.round((day.total / biggest) * 100);
    if (day.total > 0 && percent < 2) percent = 2;
    fill.style.width = percent + '%';
    track.append(fill);

    const amount = document.createElement('span');
    amount.className = 'trend-amount';
    amount.textContent = formatMoney(day.total, baseCode);

    item.append(label, track, amount);
    list.append(item);
  }
}

export function renderStats(data) {
  setText(byId('stat-count'), String(data.count));
  setText(byId('stat-total'), formatMoney(data.total, data.base));

  if (data.top) {
    setText(byId('stat-top'), data.top.name + ' (' + formatMoney(data.top.total, data.base) + ')');
  } else {
    setText(byId('stat-top'), 'None yet');
  }

  setText(byId('stat-cap'), data.capInfo.hasCap ? formatMoney(data.cap, data.base) : 'Not set');

  for (const span of document.querySelectorAll('.base-code')) {
    span.textContent = data.base;
  }

  renderTrend(data.days, data.base);

  const progress = byId('cap-progress');
  progress.hidden = !data.capInfo.hasCap;
  progress.value = data.capInfo.percent;

  if (data.capInfo.over > 0) {
    setText(byId('cap-message-polite'), '');
    setText(byId('cap-message-alert'), data.capMessage);
  } else {
    setText(byId('cap-message-alert'), '');
    setText(byId('cap-message-polite'), data.capMessage);
  }
}

export function fillCurrencySelect(select, codes, selectedCode) {
  select.textContent = '';
  for (const code of codes) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = code;
    select.append(option);
  }
  if (selectedCode) {
    select.value = selectedCode;
  }
}

export function fillCategoryList(categories) {
  const list = byId('category-list');
  list.textContent = '';
  for (const name of categories) {
    const option = document.createElement('option');
    option.value = name;
    list.append(option);
  }
}

export function readAddForm() {
  return {
    description: byId('add-description').value,
    amount: byId('add-amount').value,
    currency: byId('add-currency').value,
    category: byId('add-category').value,
    date: byId('add-date').value
  };
}

export function resetAddForm(todayKey) {
  byId('add-description').value = '';
  byId('add-amount').value = '';
  byId('add-category').value = '';
  byId('add-date').value = todayKey;
  byId('add-currency').selectedIndex = 0;

  for (const name of ['description', 'amount', 'category', 'date']) {
    showFieldError('add-' + name, '');
  }
}

export function fillSettingsForm(settings) {
  byId('set-base').value = settings.baseCurrency;
  byId('set-code-1').value = settings.otherCurrencies[0].code;
  byId('set-rate-1').value = String(settings.otherCurrencies[0].rate);
  byId('set-code-2').value = settings.otherCurrencies[1].code;
  byId('set-rate-2').value = String(settings.otherCurrencies[1].rate);
  byId('set-categories').value = settings.categories.join(', ');
}

export function readSettingsForm() {
  return {
    base: byId('set-base').value,
    code1: byId('set-code-1').value,
    rate1: byId('set-rate-1').value,
    code2: byId('set-code-2').value,
    rate2: byId('set-rate-2').value,
    categories: byId('set-categories').value
  };
}

export function showImportMessage(lines, isError) {
  const box = byId('import-message');
  box.textContent = '';
  box.classList.toggle('is-error', Boolean(isError));

  if (lines.length === 1) {
    box.textContent = lines[0];
    return;
  }

  const first = document.createElement('p');
  first.textContent = lines[0];
  box.append(first);

  const list = document.createElement('ul');
  for (let i = 1; i < lines.length; i++) {
    const item = document.createElement('li');
    item.textContent = lines[i];
    list.append(item);
  }
  box.append(list);
}
