const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('quotes.js', () => {
  let QUOTES, getRandomQuote;

  beforeEach(() => {
    jest.resetModules();

    const context = {
      window: {},
      Math: Math,
      console: console
    };
    vm.createContext(context);

    const quotesCode = fs.readFileSync(
      path.join(__dirname, '../../quotes.js'),
      'utf8'
    );
    vm.runInContext(quotesCode, context);

    ({ QUOTES, getRandomQuote } = context.window.ScreensaverQuotes);
  });

  describe('QUOTES array', () => {
    it('should contain quotes', () => {
      expect(Array.isArray(QUOTES)).toBe(true);
      expect(QUOTES.length).toBeGreaterThan(0);
    });

    it('should have non-empty string quotes', () => {
      QUOTES.forEach(quote => {
        expect(typeof quote).toBe('string');
        expect(quote.length).toBeGreaterThan(0);
      });
    });

    it('should have quotes with attribution', () => {
      const withAttribution = QUOTES.filter(q => q.includes(' — '));
      expect(withAttribution.length).toBe(QUOTES.length);
    });
  });

  describe('getRandomQuote', () => {
    it('should return a string', () => {
      const quote = getRandomQuote();
      expect(typeof quote).toBe('string');
    });

    it('should return a quote from the QUOTES array', () => {
      const quote = getRandomQuote();
      expect(QUOTES).toContain(quote);
    });

    it('should return different quotes over multiple calls', () => {
      const quotes = new Set();
      for (let i = 0; i < 50; i++) {
        quotes.add(getRandomQuote());
      }
      expect(quotes.size).toBeGreaterThan(1);
    });
  });
});
