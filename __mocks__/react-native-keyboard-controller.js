const React = require('react');

const KeyboardAvoidingView = ({ children, ...props }) =>
  React.createElement('View', props, children);

const KeyboardProvider = ({ children }) => children;

const useKeyboardHandler = () => {};
const useKeyboardContext = () => ({ height: { value: 0 } });
const useReanimatedKeyboardAnimation = () => ({
  height: { value: 0 },
  progress: { value: 0 },
});

module.exports = {
  KeyboardAvoidingView,
  KeyboardProvider,
  useKeyboardHandler,
  useKeyboardContext,
  useReanimatedKeyboardAnimation,
};
