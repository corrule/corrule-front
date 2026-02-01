/**
 * Fork count calculation utilities
 * Helps determine the correct number of forks for a rule
 */

import type { Rule } from '@/types';

/**
 * Calculate the actual number of unmerged forks for a rule
 * @param rules - Array of all rules
 * @param ruleId - ID of the original rule
 * @returns Number of unmerged, public, approved forks
 */
export function calculateUnmergedForkCount(rules: Rule[], ruleId: string): number {
  return rules.filter(
    (rule: Rule) => {
      const isFork = rule.parentRuleId === ruleId || rule.forkedFrom === ruleId;
      const isPublic = rule.visibility === 'PUBLIC';
      const isApproved = rule.status === 'APPROVED';
      const isNotMerged = !rule.mergedAt;

      return isFork && isPublic && isApproved && isNotMerged;
    }
  ).length;
}

/**
 * Calculate all forks (including merged ones) for a rule
 * @param rules - Array of all rules
 * @param ruleId - ID of the original rule
 * @returns Number of all forks (merged and unmerged)
 */
export function calculateAllForkCount(rules: Rule[], ruleId: string): number {
  return rules.filter(
    (rule: Rule) => {
      const isFork = rule.parentRuleId === ruleId || rule.forkedFrom === ruleId;
      return isFork;
    }
  ).length;
}

/**
 * Get display fork count - prioritize actual count over stored value
 * @param rule - The rule object
 * @param actualCount - Actual count if available (optional)
 * @returns The fork count to display
 */
export function getDisplayForkCount(rule: Rule, actualCount?: number): number {
  // If we have an actual count from calculation, use it
  if (actualCount !== undefined && actualCount >= 0) {
    return actualCount;
  }

  // Otherwise fall back to stored values
  return rule.forks || rule.forkCount || 0;
}
