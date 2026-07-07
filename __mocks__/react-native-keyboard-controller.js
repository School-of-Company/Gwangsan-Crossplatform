const React = require('react');
const { View, Animated } = require('react-native');

const KeyboardAvoidingView = ({ children, ...props }) => React.createElement(View, props, children);
const KeyboardStickyView = ({ children, ...props }) => React.createElement(View, props, children);

const KeyboardProvider = ({ children }) => children;

const useKeyboardHandler = () => {};
const useKeyboardContext = () => ({ height: { value: 0 } });
const useKeyboardAnimation = () => ({
  height: new Animated.Value(0),
  progress: new Animated.Value(0),
});
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
  useKeyboardAnimation,
  useReanimatedKeyboardAnimation,
};
