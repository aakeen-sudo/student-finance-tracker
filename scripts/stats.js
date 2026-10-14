// stats.js - dashboard numbers

import { convertToBase } from './state.js';

export function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export function getTotal(records) {
  let total = 0;
  for (const record of records) {
    total += convertToBase(record.amount, record.currency);
  }
  return total;
}

export function getTopCategory(records) {
  const totals = new Map();

  for (const record of records) {
    const key = record.category.toLowerCase();
    if (!totals.has(key)) {
      totals.set(key, { name: record.category, total: 0 });
    }
    totals.get(key).total += convertToBase(record.amount, record.currency);
  }

  let best = null;
  for (const item of totals.values()) {
    if (best === null || item.total > best.total) {
      best = item;
    }
  }
  return best;
}

export function getLastSevenDays(records) {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    days.push({
      key: getDateKey(day),
      label: day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      total: 0
    });
  }

  for (const record of records) {
    for (const day of days) {
      if (record.date === day.key) {
        day.total += convertToBase(record.amount, record.currency);
      }
    }
  }
  return days;
}

export function getCapInfo(total, cap) {
  if (!cap || cap <= 0) {
    return { hasCap: false, remaining: 0, over: 0, percent: 0 };
  }

  const difference = Math.round((cap - total) * 100) / 100;
  return {
    hasCap: true,
    remaining: Math.max(difference, 0),
    over: Math.max(-difference, 0),
    percent: Math.min(100, Math.round((total / cap) * 100))
  };
}

export function getCapMessage(info, baseCode) {
  if (!info.hasCap) {
    return 'No spending cap is set.';
  }
  if (info.over > 0) {
    return 'You are over your cap by ' + info.over.toFixed(2) + ' ' + baseCode + '.';
  }
  return 'You have ' + info.remaining.toFixed(2) + ' ' + baseCode + ' left under your cap.';
}
