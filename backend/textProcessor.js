const { spawn } = require('child_process');

// This function will process the text using Python and return the result
const processText = async (paragraph, targetLang, settings = {}) => {
  return new Promise((resolve, reject) => {
    // Create a Python process
    const pythonProcess = spawn('python3', ['-u', __dirname + '/textProcessingScript.py']);
    
    let dataBuffer = '';
    let errorBuffer = '';

    // Collect data from stdout
    pythonProcess.stdout.on('data', (data) => {
      dataBuffer += data.toString();
    });
    
    // Collect errors from stderr
    pythonProcess.stderr.on('data', (data) => {
      errorBuffer += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${errorBuffer}`));
      }
      
      try {
        // The Python script outputs JSON at the end
        const jsonStart = dataBuffer.lastIndexOf('JSON_OUTPUT_START');
        const jsonEnd = dataBuffer.lastIndexOf('JSON_OUTPUT_END');
        
        if (jsonStart === -1 || jsonEnd === -1) {
          return reject(new Error('Could not find valid JSON output in Python script result'));
        }
        
        const jsonStr = dataBuffer.substring(jsonStart + 'JSON_OUTPUT_START'.length, jsonEnd).trim();
        const result = JSON.parse(jsonStr);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error.message}`));
      }
    });
    
    // Handle process errors
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
    
    // Send input to the Python script
    pythonProcess.stdin.write(paragraph + '\n');
    pythonProcess.stdin.write(targetLang + '\n');
    
    // Send settings as JSON string
    pythonProcess.stdin.write(JSON.stringify(settings) + '\n');
    
    pythonProcess.stdin.end();
  });
};

module.exports = { processText }; 