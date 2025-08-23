// src/utils/helpers.js
export const initials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export const cls = (...a) => a.filter(Boolean).join(' ');