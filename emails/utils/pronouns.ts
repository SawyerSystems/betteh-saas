/**
 * Pronoun utility for gender-conditional email language
 * Supports: he/him/his, she/her/hers, they/them/their
 */

export type Gender = 'male' | 'female' | 'non-binary' | null | undefined;

export interface PronounSet {
  subject: string;    // he/she/they
  object: string;     // him/her/them
  possessive: string; // his/her/their
}

export function getPronouns(gender: Gender): PronounSet {
  switch (gender) {
    case 'male':
      return {
        subject: 'he',
        object: 'him', 
        possessive: 'his'
      };
    case 'female':
      return {
        subject: 'she',
        object: 'her',
        possessive: 'her'
      };
    case 'non-binary':
    default:
      return {
        subject: 'they',
        object: 'them',
        possessive: 'their'
      };
  }
}

/**
 * Helper functions for common pronoun usage patterns
 */
export function formatSubjectPronoun(gender: Gender, capitalize = false): string {
  const pronoun = getPronouns(gender).subject;
  return capitalize ? pronoun.charAt(0).toUpperCase() + pronoun.slice(1) : pronoun;
}

export function formatObjectPronoun(gender: Gender, capitalize = false): string {
  const pronoun = getPronouns(gender).object;
  return capitalize ? pronoun.charAt(0).toUpperCase() + pronoun.slice(1) : pronoun;
}

export function formatPossessivePronoun(gender: Gender, capitalize = false): string {
  const pronoun = getPronouns(gender).possessive;
  return capitalize ? pronoun.charAt(0).toUpperCase() + pronoun.slice(1) : pronoun;
}
