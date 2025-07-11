import { strategies, inferStrategy } from './strategies.js';

/**
 * Core evaluator for comparing generated outputs to expected values
 */
export class Evaluator {
  constructor(schema = {}) {
    this.schema = schema;
  }
  
  /**
   * Evaluate a single field
   */
  async evaluateField(predicted, expected, fieldSchema = {}) {
    const strategyName = inferStrategy(fieldSchema);
    const strategy = strategies[strategyName];
    
    if (!strategy) {
      throw new Error(`Unknown evaluation strategy: ${strategyName}`);
    }
    
    return await strategy(predicted, expected);
  }
  
  /**
   * Evaluate all fields in an object
   */
  async evaluate(predicted = {}, expected = {}) {
    const results = {};
    
    // Get all fields from expected (ground truth)
    for (const [fieldPath, expectedValue] of Object.entries(expected)) {
      const predictedValue = this.getNestedValue(predicted, fieldPath);
      const fieldSchema = this.getFieldSchema(fieldPath);
      
      try {
        results[fieldPath] = await this.evaluateField(
          predictedValue,
          expectedValue,
          fieldSchema
        );
      } catch (error) {
        results[fieldPath] = {
          error: error.message,
          success: false
        };
      }
    }
    
    return results;
  }
  
  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }
  
  /**
   * Get field schema for a given path
   */
  getFieldSchema(fieldPath) {
    if (!this.schema.properties) {
      return {};
    }
    
    const parts = fieldPath.split('.');
    let current = this.schema.properties;
    
    for (const part of parts) {
      if (!current[part]) {
        return {};
      }
      
      if (current[part].properties) {
        current = current[part].properties;
      } else {
        return current[part];
      }
    }
    
    return {};
  }
  
  /**
   * Generate summary statistics from evaluation results
   */
  generateSummary(evaluationResults) {
    const summary = {
      totalCases: evaluationResults.length,
      fieldStats: {}
    };
    
    // Aggregate by field
    const fieldResults = {};
    
    for (const result of evaluationResults) {
      for (const [field, evaluation] of Object.entries(result)) {
        if (!fieldResults[field]) {
          fieldResults[field] = [];
        }
        fieldResults[field].push(evaluation);
      }
    }
    
    // Calculate stats per field
    for (const [field, results] of Object.entries(fieldResults)) {
      const stats = {
        total: results.length,
        evaluated: results.filter(r => !r.error).length
      };
      
      // For exact matches
      const exactMatches = results.filter(r => r === true);
      if (exactMatches.length > 0) {
        stats.exactMatches = exactMatches.length;
        stats.accuracy = exactMatches.length / stats.evaluated;
      }
      
      // For multiSelect
      const multiSelectResults = results.filter(r => r.precision !== undefined);
      if (multiSelectResults.length > 0) {
        stats.avgPrecision = this.average(multiSelectResults.map(r => r.precision));
        stats.avgRecall = this.average(multiSelectResults.map(r => r.recall));
        stats.avgF1 = this.average(multiSelectResults.map(r => r.f1));
      }
      
      // For similarity
      const similarityResults = results.filter(r => r.similarity !== undefined);
      if (similarityResults.length > 0) {
        stats.avgSimilarity = this.average(similarityResults.map(r => r.similarity));
      }
      
      summary.fieldStats[field] = stats;
    }
    
    return summary;
  }
  
  average(numbers) {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}