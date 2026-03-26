const noop = () => {};
const identity = (v) => v;

const Animated = {
  Value: () => ({ value: 0 }),
  SharedValue: noop,
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  useAnimatedScrollHandler: () => ({}),
  withTiming: identity,
  withSpring: identity,
  withDelay: (_, v) => v,
  withSequence: identity,
  withRepeat: identity,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  interpolate: identity,
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  FadeIn: { duration: noop },
  FadeOut: { duration: noop },
  SlideInRight: { duration: noop },
  SlideOutLeft: { duration: noop },
  View: 'Animated.View',
  ScrollView: 'Animated.ScrollView',
  FlatList: 'Animated.FlatList',
  Image: 'Animated.Image',
  Text: 'Animated.Text',
};

module.exports = {
  ...Animated,
  default: Animated,
  createAnimatedComponent: (Component) => Component,
};
