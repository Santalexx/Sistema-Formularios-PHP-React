export const formatDate = (date, locale = 'es-CO') => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};