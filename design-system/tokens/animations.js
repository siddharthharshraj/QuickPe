/**
 * QuickPe Animation System
 *
 * Animation tokens for transitions, keyframes, and motion design.
 */

/**
 * Easing Functions
 */
export const easing = {
  // Standard easings
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom easings
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  easeInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  easeInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',

  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  easeOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeOutCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',

  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
  easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',

  // Bounce easing
  easeOutBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  easeInOutBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Elastic easing
  easeOutElastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutElastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',

  // Back easing
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

/**
 * Duration Scale
 */
export const duration = {
  instant: '0ms',
  fastest: '100ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slowest: '500ms',
  glacial: '1000ms',
};

/**
 * Keyframe Animations
 */
export const keyframes = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  // Slide animations
  slideInRight: {
    from: { transform: 'translateX(100%)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },
  slideInLeft: {
    from: { transform: 'translateX(-100%)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },
  slideInUp: {
    from: { transform: 'translateY(100%)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideInDown: {
    from: { transform: 'translateY(-100%)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },

  // Scale animations
  scaleIn: {
    from: { transform: 'scale(0.8)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.8)', opacity: 0 },
  },

  // Bounce animations
  bounceIn: {
    '0%': { transform: 'scale(0.3)', opacity: 0 },
    '50%': { transform: 'scale(1.05)', opacity: 1 },
    '70%': { transform: 'scale(0.9)', opacity: 1 },
    '100%': { transform: 'scale(1)', opacity: 1 },
  },

  // Pulse animations
  pulse: {
    '0%, 100%': { transform: 'scale(1)', opacity: 1 },
    '50%': { transform: 'scale(1.05)', opacity: 0.8 },
  },

  // Shake animations
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
  },

  // Loading animations
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },

  // Hover animations
  lift: {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(-2px)' },
  },

  // Glow animations
  glow: {
    '0%, 100%': { boxShadow: '0 0 5px rgba(5, 150, 105, 0.5)' },
    '50%': { boxShadow: '0 0 20px rgba(5, 150, 105, 0.8)' },
  },
};

/**
 * Transition Presets
 */
export const transitions = {
  // Basic transitions
  all: {
    property: 'all',
    duration: duration.normal,
    easing: easing.easeInOut,
  },
  colors: {
    property: 'color, background-color, border-color',
    duration: duration.fast,
    easing: easing.easeInOut,
  },
  opacity: {
    property: 'opacity',
    duration: duration.fast,
    easing: easing.easeInOut,
  },
  transform: {
    property: 'transform',
    duration: duration.normal,
    easing: easing.easeOut,
  },

  // Component-specific transitions
  button: {
    property: 'all',
    duration: duration.fast,
    easing: easing.easeInOut,
  },
  card: {
    property: 'box-shadow, transform',
    duration: duration.normal,
    easing: easing.easeOut,
  },
  input: {
    property: 'border-color, box-shadow',
    duration: duration.fast,
    easing: easing.easeInOut,
  },
  modal: {
    property: 'opacity, transform',
    duration: duration.normal,
    easing: easing.easeOut,
  },

  // Hover transitions
  hover: {
    property: 'transform, box-shadow',
    duration: duration.fast,
    easing: easing.easeOut,
  },

  // Focus transitions
  focus: {
    property: 'border-color, box-shadow, outline',
    duration: duration.fast,
    easing: easing.easeInOut,
  },
};

/**
 * Animation Presets
 */
export const animations = {
  // Entry animations
  fadeIn: {
    animationName: 'fadeIn',
    animationDuration: duration.normal,
    animationTimingFunction: easing.easeOut,
    animationFillMode: 'both',
  },
  slideInRight: {
    animationName: 'slideInRight',
    animationDuration: duration.normal,
    animationTimingFunction: easing.easeOut,
    animationFillMode: 'both',
  },
  slideInLeft: {
    animationName: 'slideInLeft',
    animationDuration: duration.normal,
    animationTimingFunction: easing.easeOut,
    animationFillMode: 'both',
  },
  scaleIn: {
    animationName: 'scaleIn',
    animationDuration: duration.normal,
    animationTimingFunction: easing.easeOut,
    animationFillMode: 'both',
  },
  bounceIn: {
    animationName: 'bounceIn',
    animationDuration: duration.slow,
    animationTimingFunction: easing.easeOut,
    animationFillMode: 'both',
  },

  // Continuous animations
  pulse: {
    animationName: 'pulse',
    animationDuration: duration.slow,
    animationTimingFunction: easing.easeInOut,
    animationIterationCount: 'infinite',
  },
  spin: {
    animationName: 'spin',
    animationDuration: duration.slow,
    animationTimingFunction: easing.linear,
    animationIterationCount: 'infinite',
  },
  glow: {
    animationName: 'glow',
    animationDuration: duration.slow,
    animationTimingFunction: easing.easeInOut,
    animationIterationCount: 'infinite',
  },

  // Hover animations
  lift: {
    animationName: 'lift',
    animationDuration: duration.fast,
    animationTimingFunction: easing.easeOut,
  },

  // Error animations
  shake: {
    animationName: 'shake',
    animationDuration: duration.fast,
    animationTimingFunction: easing.easeInOut,
  },
};

/**
 * Staggered Animation Delays
 */
export const stagger = {
  fast: '50ms',
  normal: '100ms',
  slow: '150ms',
  slower: '200ms',
};

/**
 * Animation Utility Functions
 */
export const animationUtils = {
  easing,
  duration,
  keyframes,
  transitions,
  animations,
  stagger,

  /**
   * Create custom transition
   * @param {string} property - CSS property to animate
   * @param {string} duration - Animation duration
   * @param {string} easing - Easing function
   * @param {string} delay - Animation delay
   * @returns {string} CSS transition value
   */
  createTransition: (property = 'all', duration = '200ms', easing = 'ease-in-out', delay = '0ms') => {
    return `${property} ${duration} ${easing} ${delay}`;
  },

  /**
   * Create custom animation
   * @param {string} name - Animation name
   * @param {string} duration - Animation duration
   * @param {string} easing - Easing function
   * @param {string} delay - Animation delay
   * @param {string} iterationCount - Iteration count
   * @param {string} direction - Animation direction
   * @param {string} fillMode - Fill mode
   * @returns {string} CSS animation value
   */
  createAnimation: (
    name,
    duration = '200ms',
    easing = 'ease-in-out',
    delay = '0ms',
    iterationCount = '1',
    direction = 'normal',
    fillMode = 'none'
  ) => {
    return `${name} ${duration} ${easing} ${delay} ${iterationCount} ${direction} ${fillMode}`;
  },

  /**
   * Create staggered animations
   * @param {Array} elements - Elements to animate
   * @param {string} delay - Base delay between animations
   * @returns {Array} Elements with staggered delays
   */
  createStaggered: (elements, delay = stagger.normal) => {
    return elements.map((element, index) => ({
      ...element,
      style: {
        ...element.style,
        animationDelay: `${parseInt(delay) * index}ms`,
      },
    }));
  },

  /**
   * Get easing function by name
   * @param {string} name - Easing function name
   * @returns {string} CSS easing value
   */
  getEasing: (name) => easing[name] || easing.easeInOut,

  /**
   * Get duration by name
   * @param {string} name - Duration name
   * @returns {string} CSS duration value
   */
  getDuration: (name) => duration[name] || duration.normal,

  /**
   * Get keyframes by name
   * @param {string} name - Keyframe name
   * @returns {object} Keyframe definition
   */
  getKeyframes: (name) => keyframes[name] || keyframes.fadeIn,

  /**
   * Get transition preset
   * @param {string} name - Transition preset name
   * @returns {object} Transition configuration
   */
  getTransition: (name) => transitions[name] || transitions.all,

  /**
   * Get animation preset
   * @param {string} name - Animation preset name
   * @returns {object} Animation configuration
   */
  getAnimation: (name) => animations[name] || animations.fadeIn,
};

// Default export
export { animationUtils as animations };
export default animationUtils;
