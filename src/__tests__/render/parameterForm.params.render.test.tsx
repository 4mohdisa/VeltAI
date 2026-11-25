// ParameterForm (src/components/gym/ParameterForm.tsx) pushes its params to the
// parent from one effect on params: on mount, after the last-logged pre-fill and
// after each edit. Network mocked.
import { ParameterForm } from '@/components/gym/ParameterForm';
import type { ParameterSchema } from '@/lib/api';
import { act, findAll, renderScreen } from './helpers';

const mockLastLogged = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: {
      lastLogged: (...args: unknown[]) => mockLastLogged(...args),
      previewCalories: () => new Promise(() => {}),
    },
  },
}));

const schema: ParameterSchema = {
  fields: [
    { key: 'minutes', label: 'Minutes', type: 'number', required: true, default: 30 },
    { key: 'incline', label: 'Incline', type: 'number', required: false },
  ],
  calorie_formula: 'met',
};

async function flush() {
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

test('sends the defaults on mount, then the last-logged pre-fill, then each edit', async () => {
  mockLastLogged.mockResolvedValue({ parameters: { incline: 4 } });
  const onParamsChange = jest.fn();
  const tree = renderScreen(<ParameterForm exerciseId="ex1" schema={schema} onParamsChange={onParamsChange} />);
  expect(onParamsChange).toHaveBeenNthCalledWith(1, { minutes: 30 });

  await flush();
  expect(onParamsChange).toHaveBeenLastCalledWith({ minutes: 30, incline: 4 });

  const minutes = findAll(tree, (p) => p.value === '30' && typeof p.onChangeText === 'function')[0];
  expect(minutes).toBeDefined();
  await act(async () => {
    (minutes.props.onChangeText as (v: string) => void)('45');
  });
  expect(onParamsChange).toHaveBeenLastCalledWith({ minutes: 45, incline: 4 });
});
