import { Text } from 'react-native';
import { renderScreen, allText } from './helpers';

test('render infrastructure mounts a real component tree', () => {
  const tree = renderScreen(<Text>hello lume</Text>);
  expect(allText(tree)).toContain('hello lume');
});
