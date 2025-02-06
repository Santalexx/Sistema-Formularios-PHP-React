export const validateAge = (birthDate, documentType) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    const validations = {
        1: { min: 14, max: 17, message: 'Para tarjeta de identidad debe tener entre 14 y 17 años' },
        2: { min: 18, max: null, message: 'Debe ser mayor de 18 años para cédula' },
        3: { min: 18, max: null, message: 'Debe ser mayor de 18 años para cédula de extranjería' },
        4: { min: 18, max: null, message: 'Debe ser mayor de 18 años para NIT' }
    };

    const validation = validations[documentType];
    if (!validation) return { isValid: false, message: 'Tipo de documento no válido' };

    const isValid = age >= validation.min && (!validation.max || age <= validation.max);
    return { isValid, message: isValid ? '' : validation.message };
};