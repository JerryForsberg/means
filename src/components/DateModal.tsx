import React from "react";

interface DateModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const DateModal: React.FC<DateModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/25"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-3xl rounded-lg shadow-xl p-6 relative"
                onClick={(e) => e.stopPropagation()} // prevent click-through close
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-white bg-blue-600 hover:bg-blue-700 text-xl font-bold"
                >
                    ×
                </button>
                {children}
            </div>
        </div>
    );
};

export default DateModal;



