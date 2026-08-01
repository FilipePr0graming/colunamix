import { test, expect } from '@playwright/test';
import { clampContestToDatabase } from '../../src/shared/contestLimits';

test.describe('contest final limiter', () => {
  test('ajusta Concurso Final e pesquisas de padrões ao último concurso da base', () => {
    expect(clampContestToDatabase(3716, 3704)).toEqual({ value: 3704, adjusted: true });
    expect(clampContestToDatabase(3704, 3704)).toEqual({ value: 3704, adjusted: false });
    expect(clampContestToDatabase(3600, 3704)).toEqual({ value: 3600, adjusted: false });
  });
});
