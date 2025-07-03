#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

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
      // Use Claude CLI to check if content contains "mew"
      const prompt = `Does the following text contain the word "mew" (case insensitive)? Answer only "yes" or "no":\n\n${content}`;
      
      const claude = spawn('claude', ['-p', prompt, '--output-format', 'json'], {
        env: process.env,
        shell: true
      });
      
      let claudeOutput = '';
      let claudeError = '';

      claude.stdout.on('data', (data) => {
        claudeOutput += data.toString();
      });

      claude.stderr.on('data', (data) => {
        claudeError += data.toString();
      });

      claude.on('close', (code) => {
        // Define log file paths
        const logsDir = path.join(__dirname, '..', 'logs');
        const logFile = path.join(logsDir, 'cat-events.log');
        const modelLogFile = path.join(logsDir, 'model-events.log');

        // Ensure logs directory exists
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }

        // Log prompt and response to model-events.log
        const timestamp = new Date().toISOString();
        const modelLogEntry = `[${timestamp}] PROMPT:\n${prompt}\n\n[${timestamp}] RESPONSE:\n${claudeOutput}\n[${timestamp}] ERROR (if any):\n${claudeError}\n[${timestamp}] EXIT CODE: ${code}\n---\n`;
        fs.appendFileSync(modelLogFile, modelLogEntry);

        // Parse Claude's response
        let logMessage;
        try {
          // Try to parse JSON response
          const jsonResponse = JSON.parse(claudeOutput);
          const responseText = jsonResponse.content || jsonResponse.response || claudeOutput;

          if (responseText.toLowerCase().includes('yes')) {
            logMessage = `[${timestamp}] cat detected\n`;
          } else {
            logMessage = `[${timestamp}] no cat detected\n`;
          }
        } catch (parseError) {
          // Fallback to simple string check
          const response = claudeOutput.toLowerCase().trim();
          if (response.includes('yes')) {
            logMessage = `[${timestamp}] cat detected\n`;
          } else {
            logMessage = `[${timestamp}] no cat detected\n`;
          }
        }
        
        // Append to log file
        fs.appendFileSync(logFile, logMessage);
        
        // Exit successfully
        process.exit(0);
      });
    } else {
      // No content to process, exit successfully
      process.exit(0);
    }
  } catch (error) {
    // Log error but still exit with success to not block
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(0);
  }
});