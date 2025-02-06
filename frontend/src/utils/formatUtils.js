export const formatPhoneNumber = (number) => {
    if (!number) return '';
    // Formato: 3XX-XXX-XXXX
    return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};