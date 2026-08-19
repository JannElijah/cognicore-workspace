import '@testing-library/jest-dom';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ status: 'success', goals: [] }),
    text: () => Promise.resolve(''),
    ok: true,
    clone: function() { return this; }
  })
);
