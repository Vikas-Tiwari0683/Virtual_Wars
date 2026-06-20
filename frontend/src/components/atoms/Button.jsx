// =============================================================================
// SECTION: Button Atom
// Reusable button with variant support matching the CarbonTrace design system.
// Variants: primary | secondary | ghost | destructive
// All variants meet WCAG 2.1 AA contrast and include focus-visible ring.
// =============================================================================

import PropTypes from 'prop-types';

const VARIANT_CLASSES = {
  primary:
    'bg-[#006b2c] text-white hover:bg-[#00873a] active:scale-[0.98] shadow-sm',
  secondary:
    'border border-[#006b2c] text-[#006b2c] bg-transparent hover:bg-[#f0fdf4] active:scale-[0.98]',
  ghost:
    'text-[#3e4a3d] bg-transparent hover:bg-[#e9edff] active:scale-[0.98]',
  destructive:
    'bg-[#ba1a1a] text-white hover:bg-[#93000a] active:scale-[0.98]',
};

/**
 * @param {'primary'|'secondary'|'ghost'|'destructive'} variant
 * @param {string}  className – extra Tailwind classes
 * @param {boolean} fullWidth – makes the button fill its container
 * @param {boolean} disabled
 * @param {string}  type      – button | submit | reset
 */
export default function Button({
  children,
  variant = 'primary',
  className = '',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] font-semibold text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006b2c] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children:  PropTypes.node,
  variant:   PropTypes.oneOf(['primary', 'secondary', 'ghost', 'destructive']),
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled:  PropTypes.bool,
  type:      PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick:   PropTypes.func,
};
