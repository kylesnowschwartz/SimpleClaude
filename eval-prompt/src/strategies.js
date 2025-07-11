/**
 * Simple evaluation strategies for different field types
 */

export const strategies = {
  /**
   * Exact match comparison
   */
  exact: (predicted, expected) => predicted === expected,
  
  /**
   * Check if value is included in array
   */
  includes: (predicted, expected) => {
    if (Array.isArray(expected)) {
      return expected.includes(predicted);
    }
    return expected === predicted;
  },
  
  /**
   * Multi-select evaluation with precision/recall
   */
  multiSelect: (predicted = [], expected = []) => {
    const predSet = new Set(predicted);
    const expSet = new Set(expected);
    const intersection = [...predSet].filter(x => expSet.has(x));
    
    const precision = predSet.size === 0 ? 0 : intersection.length / predSet.size;
    const recall = expSet.size === 0 ? 1 : intersection.length / expSet.size;
    const f1 = (precision + recall) === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    
    return {
      precision,
      recall,
      f1,
      matches: intersection.length,
      predicted: predSet.size,
      expected: expSet.size
    };
  },
  
  /**
   * Simple text similarity (placeholder - implement LLM-based later)
   */
  similarity: async (predicted, expected) => {
    // For now, just do basic string comparison
    // TODO: Implement LLM-based similarity
    if (predicted === expected) return { similarity: 1.0 };
    
    // Basic length-based similarity as placeholder
    const maxLen = Math.max(predicted.length, expected.length);
    const minLen = Math.min(predicted.length, expected.length);
    const lengthSimilarity = minLen / maxLen;
    
    return { similarity: lengthSimilarity };
  }
};

/**
 * Infer evaluation strategy from schema type
 */
export function inferStrategy(fieldSchema) {
  // Check for explicit evaluation strategy
  if (fieldSchema?.evaluation) {
    return fieldSchema.evaluation;
  }
  
  // Infer from type
  const type = fieldSchema?.type;
  
  if (type === 'boolean' || type === 'number' || type === 'integer') {
    return 'exact';
  }
  
  if (type === 'array') {
    return 'multiSelect';
  }
  
  if (type === 'string') {
    // Check if it has enum values
    if (fieldSchema.enum) {
      return 'includes';
    }
    // Default string handling
    return 'similarity';
  }
  
  // Default
  return 'exact';
}