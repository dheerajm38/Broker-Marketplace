// utils/sanitizers.js
export const sanitizeInput = (data) => {
    if (typeof data !== 'object') return data;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            sanitized[key] = value.trim().replace(/[<>]/g, '');
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeInput(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};