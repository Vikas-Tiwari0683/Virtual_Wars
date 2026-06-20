// =============================================================================
// Atom: InputField
// Labeled input with icon support, error state, and focus ring.
// Design spec: Gray 100 bg, 8px radius, green focus ring on active.
// =============================================================================

import PropTypes from 'prop-types';

export default function InputField({
  id,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  icon: Icon = null,
  className = '',
  required = false,
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* --- Label --- */}
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-[#3e4a3d] uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      {/* --- Input wrapper with optional leading icon --- */}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Icon size={16} className="text-[#6e7b6c]" aria-hidden="true" />
          </div>
        )}

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            'w-full bg-[#f1f3ff] rounded-lg border',
            'text-sm text-[#141b2b] placeholder:text-[#6e7b6c]',
            'min-h-[44px]',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#006b2c] focus:border-[#006b2c]',
            Icon ? 'pl-9 pr-4 py-2.5' : 'px-4 py-2.5',
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-[#bdcaba] focus:ring-[#006b2c]',
          ].join(' ')}
          {...rest}
        />
      </div>

      {/* --- Error message --- */}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600 mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}

InputField.propTypes = {
  id:          PropTypes.string,
  label:       PropTypes.string,
  type:        PropTypes.string,
  placeholder: PropTypes.string,
  value:       PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange:    PropTypes.func,
  error:       PropTypes.string,
  icon:        PropTypes.elementType,
  className:   PropTypes.string,
  required:    PropTypes.bool,
};
