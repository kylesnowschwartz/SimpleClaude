#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import chalk from 'chalk';
import { Evaluator } from '../src/evaluator.js';

const program = new Command();

program
  .name('eval-prompt')
  .description('Lightweight tool for evaluating and refining prompts')
  .version('0.1.0');

// Quick test command for single evaluation
program
  .command('test')
  .description('Quickly test a single case')
  .option('-p, --predicted <json>', 'predicted output (JSON string)')
  .option('-e, --expected <json>', 'expected output (JSON string)')
  .option('-s, --schema <file>', 'schema file (optional)')
  .action(async (options) => {
    try {
      const predicted = JSON.parse(options.predicted);
      const expected = JSON.parse(options.expected);
      
      let schema = {};
      if (options.schema) {
        schema = JSON.parse(readFileSync(options.schema, 'utf8'));
      }
      
      const evaluator = new Evaluator(schema);
      const results = await evaluator.evaluate(predicted, expected);
      
      // Display results
      console.log(chalk.bold('\nEvaluation Results:'));
      console.log(chalk.gray('─'.repeat(50)));
      
      for (const [field, result] of Object.entries(results)) {
        if (result === true) {
          console.log(chalk.green(`✓ ${field}`));
        } else if (result === false) {
          console.log(chalk.red(`✗ ${field}`));
        } else if (result.precision !== undefined) {
          const color = result.f1 > 0.8 ? chalk.green : result.f1 > 0.6 ? chalk.yellow : chalk.red;
          console.log(color(`◐ ${field}: P=${result.precision.toFixed(2)} R=${result.recall.toFixed(2)} F1=${result.f1.toFixed(2)}`));
        } else if (result.similarity !== undefined) {
          const color = result.similarity > 0.8 ? chalk.green : result.similarity > 0.6 ? chalk.yellow : chalk.red;
          console.log(color(`~ ${field}: similarity=${result.similarity.toFixed(2)}`));
        } else if (result.error) {
          console.log(chalk.red(`✗ ${field}: ${result.error}`));
        }
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// TODO: Add more commands (run, compare, watch, diff)
program
  .command('run')
  .description('Run evaluation on test cases')
  .option('-p, --prompt <file>', 'prompt file')
  .option('-c, --cases <file>', 'test cases file')
  .option('-m, --model <name>', 'model to use', 'gpt-4')
  .action(async (options) => {
    console.log(chalk.yellow('Run command not yet implemented'));
    console.log('This will evaluate prompts against test cases');
  });

program.parse(process.argv);