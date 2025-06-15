/**
 * Valida el formato de un correo electrónico usando una expresión regular simple.
 * @param {string} email - Correo electrónico a validar.
 * @returns {boolean} true si el correo es válido, false si no lo es.
 * @example isValidEmail("test@gmail.com") => true
 * @example isValidEmail("test@") => false
 */
export const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
}
