const React = require('react');
const { View, Animated, ScrollView } = require('react-native');

const KeyboardAvoidingView = ({ children, ...props }) => React.createElement(View, props, children);
const KeyboardStickyView = ({ children, ...props }) => React.createElement(View, props, children);

const KeyboardAwareScrollView = React.forwardRef(
  (
    {
      children,
      bottomOffset,
      disableScrollOnKeyboardHide,
      enabled,
      extraKeyboardSpace,
      mode,
      ScrollViewComponent,
      ...props
    },
    ref
  ) => React.createElement(ScrollView, { ref, ...props }, children)
);

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
  KeyboardAwareScrollView,
  KeyboardProvider,
  useKeyboardHandler,
  useKeyboardContext,
  useKeyboardAnimation,
  useReanimatedKeyboardAnimation,
};
