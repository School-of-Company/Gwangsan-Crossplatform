const React = require('react');
const { View } = require('react-native');

const LinearGradient = ({
  children,
  colors: _colors,
  start: _start,
  end: _end,
  locations: _locations,
  ...props
}) => React.createElement(View, props, children);

module.exports = { LinearGradient };
