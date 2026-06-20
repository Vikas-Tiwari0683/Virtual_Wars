// =============================================================================
// SECTION: MaterialIcon Atom
// Thin wrapper around Google Material Symbols Outlined icon font.
// Accepts fill (0 = outline, 1 = filled), weight, and size props so we keep
// icon rendering consistent across the whole app without repeating inline
// style strings everywhere.
// =============================================================================

import PropTypes from 'prop-types';

/**
 * @param {string}  name    – Material Symbol name, e.g. "eco", "dashboard"
 * @param {0|1}     fill    – 0 = outlined (default), 1 = filled
 * @param {number}  weight  – font weight 100–700 (default 400)
 * @param {string}  className – additional Tailwind classes for size/colour
 */
export default function MaterialIcon({ name, fill = 0, weight = 400, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24` }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

MaterialIcon.propTypes = {
  name:      PropTypes.string.isRequired,
  fill:      PropTypes.oneOf([0, 1]),
  weight:    PropTypes.number,
  className: PropTypes.string,
};
