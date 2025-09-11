export const Button = ({label, onClick, disabled = false, variant = "primary", className = ""}) => {
    const baseClasses = "font-medium rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed";
    
    const variants = {
        primary: `text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-300 disabled:from-gray-400 disabled:to-gray-500`,
        secondary: `text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-400`,
        danger: `text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-300 disabled:from-gray-400 disabled:to-gray-500`
    };

    const defaultPadding = className.includes('px-') || className.includes('py-') ? '' : 'px-5 py-3';
    const defaultWidth = className.includes('w-') ? '' : 'w-full';

    return (
        <button 
            onClick={onClick} 
            type="button" 
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]} ${defaultPadding} ${defaultWidth} ${className}`}
            aria-disabled={disabled}
        >
            {label}
        </button>
    );
}