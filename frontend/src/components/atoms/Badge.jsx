// =============================================================================
// SECTION: Badge Atom
// Small pill label used for carbon status, category tags, and savings chips.
// =============================================================================

import PropTypes from 'prop-types';

/**
 * @param {'green'|'amber'|'red'|'default'} variant
 * @param {string} className – extra Tailwind classes
 */
export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    green: 'bg-[#b1f2be] text-[#347047]',
    amber: 'bg-[#ffdcc3] text-[#8d4b00]',
    red: 'bg-[#ffdad6] text-[#93000a]',
    default: 'bg-[#e9edff] text-[#3e4a3d]',
  };

  const variantClass = variants[variant] ?? variants.default;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${variantClass} ${className}`}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children:  PropTypes.node,
  variant:   PropTypes.oneOf(['green', 'amber', 'red', 'default']),
  className: PropTypes.string,
};
