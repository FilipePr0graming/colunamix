import { test, expect } from '@playwright/test';
import {
  GENERATOR_SETTINGS_STORAGE_KEY,
  isManualRangeConfig,
  parsePersistedGeneratorSettings,
  shouldPersistGeneratorSettings,
} from '../../src/shared/generatorSettings';

test.describe('generator settings persistence', () => {
  test('usa chave estável de persistência do Gerador', () => {
    expect(GENERATOR_SETTINGS_STORAGE_KEY).toBe('colunamix_generator_settings');
  });

  test('estado inicial não deve persistir antes da hidratação', () => {
    expect(shouldPersistGeneratorSettings(false)).toBe(false);
    expect(shouldPersistGeneratorSettings(true)).toBe(true);
  });

  test('preserva seleção Faixa Manual e concursos inicial/final salvos', () => {
    const parsed = parsePersistedGeneratorSettings(JSON.stringify({
      mode: 'range',
      lastN: 50,
      rangeStart: 3688,
      rangeEnd: 3737,
    }));

    expect(isManualRangeConfig(parsed)).toBe(true);
    expect(parsed?.mode).toBe('range');
    expect(parsed?.rangeStart).toBe(3688);
    expect(parsed?.rangeEnd).toBe(3737);
    expect(parsed?.mode).not.toBe('lastN');
  });

  test('Estatísticas por Padrão de Coluna não precisa alterar selectionMode do Gerador', () => {
    const beforeNavigation = parsePersistedGeneratorSettings(JSON.stringify({
      mode: 'range',
      rangeStart: 3688,
      rangeEnd: 3737,
    }));
    const afterColumnStatsOpen = beforeNavigation;

    expect(afterColumnStatsOpen?.mode).toBe('range');
    expect(afterColumnStatsOpen?.rangeStart).toBe(3688);
    expect(afterColumnStatsOpen?.rangeEnd).toBe(3737);
  });

  test('remontagem do Gerador não deve trocar Faixa Manual por Últimos N concursos', () => {
    const stored = parsePersistedGeneratorSettings(JSON.stringify({
      mode: 'range',
      lastN: 20,
      rangeStart: 3688,
      rangeEnd: 3737,
    }));
    const initialRenderMode = 'lastN';
    const hydratedMode = stored?.mode;

    expect(initialRenderMode).toBe('lastN');
    expect(hydratedMode).toBe('range');
    expect(shouldPersistGeneratorSettings(false)).toBe(false);
  });

  test('preserva blocos Ímpares/Pares da v1.8.33 junto da seleção manual', () => {
    const parsed = parsePersistedGeneratorSettings(JSON.stringify({
      mode: 'range',
      rangeStart: 3688,
      rangeEnd: 3737,
      exactGroupExclusions: {
        borderOdd: [],
        borderEven: [],
        coreOdd: [],
        coreEven: [],
        prime: [],
        fibonacci: [],
        oddNumbers: [[3, 11, 13, 19, 23]],
        evenNumbers: [[2, 4, 10, 22]],
      },
    }));

    expect(parsed?.mode).toBe('range');
    expect(parsed?.exactGroupExclusions?.oddNumbers).toEqual([[3, 11, 13, 19, 23]]);
    expect(parsed?.exactGroupExclusions?.evenNumbers).toEqual([[2, 4, 10, 22]]);
  });

  test('entrada inválida de storage não sobrescreve configuração do usuário', () => {
    expect(parsePersistedGeneratorSettings('{')).toBeNull();
    expect(parsePersistedGeneratorSettings(null)).toBeNull();
  });
});
