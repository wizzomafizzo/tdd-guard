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
    
    // Create timestamp entry
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp: timestamp,
      event: hookData.event,
      tool: hookData.tool || 'N/A',
      data: hookData
    };
    
    // Define log file path
    const logsDir = path.join(__dirname, '..', 'logs');
    const logFile = path.join(logsDir, 'hook-events.log');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Append to log file
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
    // Output success (hooks can communicate back via stdout)
    console.log(JSON.stringify({
      success: true,
      message: `Logged ${hookData.event} event at ${timestamp}`
    }));
    
    // Exit with success code
    process.exit(0);
  } catch (error) {
    // Log error and exit with failure
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(1);
  }
});