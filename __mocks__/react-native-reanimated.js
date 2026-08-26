const noop = () => {};
const identity = (v) => v;

const Easing = {
  linear: identity,
  ease: identity,
  quad: identity,
  cubic: identity,
  bezier: () => identity,
  in: (fn) => fn,
  out: (fn) => fn,
  inOut: (fn) => fn,
};

function createAnimationBuilderMock() {
  const builder = {};
  [
    'duration',
    'easing',
    'delay',
    'springify',
    'damping',
    'mass',
    'stiffness',
    'withInitialValues',
    'withCallback',
    'reduceMotion',
  ].forEach((method) => {
    builder[method] = () => builder;
  });
  return builder;
}

const ReduceMotion = {
  System: 'system',
  Always: 'always',
  Never: 'never',
};

const Animated = {
  Easing,
  ReduceMotion,
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
  FadeIn: createAnimationBuilderMock(),
  FadeOut: createAnimationBuilderMock(),
  FadeInRight: createAnimationBuilderMock(),
  FadeInLeft: createAnimationBuilderMock(),
  SlideInRight: createAnimationBuilderMock(),
  SlideInLeft: createAnimationBuilderMock(),
  SlideOutLeft: createAnimationBuilderMock(),
  LinearTransition: createAnimationBuilderMock(),
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
