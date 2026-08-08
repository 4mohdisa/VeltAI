// Reanimated's native worklets runtime does not exist under jest. Jest picks
// this up automatically for the node_modules package (root __mocks__ dir), so
// the onboarding screens' progress dots and card entrances render as plain
// views instead of throwing WorkletsError at import time.
module.exports = require('react-native-reanimated/mock');
