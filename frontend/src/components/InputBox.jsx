export const InputBox = ({label, placeholder, onChange, type = "text", error, required = false, value}) => {
    const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    
    return <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label 
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      </div>
      <input 
        id={inputId}
        type={type}
        onChange={onChange} 
        placeholder={placeholder} 
        value={value}
        className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error 
            ? 'border-red-300 bg-red-50 focus:ring-red-500' 
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        required={required}
      />
      {error && (
        <p 
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
}; export default InputBox;
