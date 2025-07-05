#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the hook data from stdin
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    const hookData = JSON.parse(inputData);

    // Extract content from tool_input based on the tool type
    let content = null;

    if (hookData.tool_input) {
      // Check for new_string (Edit, MultiEdit operations)
      if (hookData.tool_input.new_string !== undefined) {
        content = hookData.tool_input.new_string;
      }
      // Check for content (Write operations)
      else if (hookData.tool_input.content !== undefined) {
        content = hookData.tool_input.content;
      }
    }

    // Only process if we found content
    if (content !== null && content.trim() !== '') {
      // Define log file paths
      const logsDir = path.join(__dirname, '..', 'logs');
      const logFile = path.join(logsDir, 'cat-events.log');
      const modelLogFile = path.join(logsDir, 'model-events.log');

      // Ensure logs directory exists
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString();

      try {
        // Escape content for shell
        const escapedContent = content.replace(/'/g, "'\\''");

        // Use execSync with a simple prompt
        const claudeOutput = execSync(
          `claude -p 'Does the following content contain the word "mew"? Answer yes or no:\n<content>\n${escapedContent}\n</content>\n' --output-format json --max-turns 1`,
          {
            encoding: 'utf8',
            timeout: 20000
          }
        );

        // Log prompt and response to model-events.log
        const modelLogEntry = `[${timestamp}] PROMPT:\nDoes this text contain the word "mew"? Answer yes or no: ${content}\n\n[${timestamp}] RESPONSE:\n${claudeOutput}\n[${timestamp}] ERROR (if any):\nNone\n[${timestamp}] EXIT CODE: 0\n---\n`;
        fs.appendFileSync(modelLogFile, modelLogEntry);

        // Parse Claude's response
        let logMessage;
        try {
          const jsonResponse = JSON.parse(claudeOutput);
          const answer = jsonResponse.result?.toLowerCase();

          if (answer === 'yes') {
            logMessage = `[${timestamp}] MEW DETECTED in ${hookData.tool_name} operation\n`;
          } else {
            logMessage = `[${timestamp}] No mew found in ${hookData.tool_name} operation\n`;
          }
        } catch (parseError) {
          logMessage = `[${timestamp}] ERROR parsing response: ${parseError.message}\n`;
        }

        // Append to log file
        fs.appendFileSync(logFile, logMessage);

      } catch (error) {
        // Log error
        const modelLogEntry = `[${timestamp}] ERROR:\n${error.message}\n---\n`;
        fs.appendFileSync(modelLogFile, modelLogEntry);

        const logMessage = `[${timestamp}] ERROR: ${error.message}\n`;
        fs.appendFileSync(logFile, logMessage);
      }
    }

    // Exit successfully
    process.exit(0);
  } catch (error) {
    // Log error but still exit with success to not block
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(0);
  }
});