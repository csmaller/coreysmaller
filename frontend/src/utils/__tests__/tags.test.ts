import { parseTags } from '../tags';

describe('parseTags', () => {
  it('splits commas, trims hash marks, and drops duplicates', () => {
    expect(parseTags('#php, laravel, #PHP')).toEqual(['php', 'laravel']);
    expect(parseTags(['#ski', 'night, ski'])).toEqual(['ski', 'night']);
    expect(parseTags(null)).toEqual([]);
    expect(parseTags('')).toEqual([]);
    expect(parseTags([' , # '])).toEqual([]);
  });
});
