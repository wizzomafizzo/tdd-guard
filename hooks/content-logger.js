#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the hook data from stdin
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
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
    
    // Only log if we found content
    if (content !== null) {
      // Define log file path
      const logsDir = path.join(__dirname, '..', 'logs');
      const logFile = path.join(logsDir, 'content-events.log');
      
      // Ensure logs directory exists
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Append content to log file with a separator
      fs.appendFileSync(logFile, content + '\n---\n');
    }
    
    // Always exit successfully to not block operations
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