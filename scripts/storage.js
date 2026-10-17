// storage.js - localStorage and downloads

const RECORDS_KEY = 'sft:records';
const SETTINGS_KEY = 'sft:settings';

export function loadRecords() {
  try {
    const text = localStorage.getItem('sft:records');
   if (!text) {
      return [];
   }
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    return [];
  }
}

export function saveRecords(records) {
  try {
    localStorage.setItem('sft:records', JSON.stringify(records));
    return true;
  } catch (error) {
    return false;
  }
}

export function loadSettings() {
  try {
    const text = localStorage.getItem(SETTINGS_KEY);
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    return false;
  }
}

export function downloadJSON(filename, data) {
  const text = JSON.stringify(data, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
