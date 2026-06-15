const React = require('react');
const { View } = require('react-native');

const KeyboardAvoidingView = ({ children, ...props }) => React.createElement(View, props, children);
const KeyboardStickyView = ({ children, ...props }) => React.createElement(View, props, children);

const KeyboardProvider = ({ children }) => children;

const useKeyboardHandler = () => {};
const useKeyboardContext = () => ({ height: { value: 0 } });
const useReanimatedKeyboardAnimation = () => ({
  height: { value: 0 },
  progress: { value: 0 },
});

module.exports = {
  KeyboardAvoidingView,
  KeyboardStickyView,
  KeyboardProvider,
  useKeyboardHandler,
  useKeyboardContext,
  useReanimatedKeyboardAnimation,
};
