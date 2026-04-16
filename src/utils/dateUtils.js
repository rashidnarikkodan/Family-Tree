import { differenceInYears, isValid } from 'date-fns';

/**
 * Calculates the age from a date of birth string.
 * @param {string} dob - Date of Birth (ISO string format preferred, e.g., '1990-01-01')
 * @returns {number|null} Age or null if invalid/missing
 */
export const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (!isValid(birthDate)) return null;
  
  return differenceInYears(new Date(), birthDate);
};

export const formatFirestoreDate = (timestamp) => {
  if (!timestamp) return 'No date';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};
