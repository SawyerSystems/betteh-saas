/**
 * Example usage of the pronoun utility for email templates
 * 
 * This file demonstrates how to use the gender-conditional pronoun system
 * across different email templates in the gymnastics booking platform.
 */

import { formatPossessivePronoun, formatSubjectPronoun, formatObjectPronoun, type Gender } from '../utils/pronouns';

// Example data
const athleteName = "Alex";
const maleFemaleExample: Gender = 'male';
const femaleExample: Gender = 'female'; 
const nonBinaryExample: Gender = 'non-binary';
const nullExample: Gender = null;

// Usage examples:

// For male athlete: "his training", "He crushed it", "see him shine"
console.log(`Here's how to get the most out of ${formatPossessivePronoun(maleFemaleExample)} training.`);
console.log(`${formatSubjectPronoun(maleFemaleExample, true)} crushed it today!`);
console.log(`I can't wait to see ${formatObjectPronoun(maleFemaleExample)} shine!`);

// For female athlete: "her training", "She crushed it", "see her shine"  
console.log(`Here's how to get the most out of ${formatPossessivePronoun(femaleExample)} training.`);
console.log(`${formatSubjectPronoun(femaleExample, true)} crushed it today!`);
console.log(`I can't wait to see ${formatObjectPronoun(femaleExample)} shine!`);

// For non-binary or null (defaults to they/them/their): "their training", "They crushed it", "see them shine"
console.log(`Here's how to get the most out of ${formatPossessivePronoun(nonBinaryExample)} training.`);
console.log(`${formatSubjectPronoun(nonBinaryExample, true)} crushed it today!`);
console.log(`I can't wait to see ${formatObjectPronoun(nonBinaryExample)} shine!`);

// Null/undefined defaults to they/them/their for inclusive language
console.log(`Here's how to get the most out of ${formatPossessivePronoun(nullExample)} training.`);

/**
 * Email template integration pattern:
 * 
 * 1. Import the utility and Gender type
 * 2. Add athleteGender?: Gender to component props
 * 3. Replace hardcoded pronouns with function calls
 * 
 * Example:
 * - Old: "Here's how to get the most out of their training:"
 * - New: "Here's how to get the most out of {formatPossessivePronoun(athleteGender)} training:"
 */
