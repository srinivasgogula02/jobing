require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.API_KEY || 'default_dev_secret_key';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/compile', async (req, res) => {
  // 1. Authenticate with API_KEY
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
  }

  const { latex } = req.body;
  if (!latex || typeof latex !== 'string') {
    return res.status(400).json({ error: 'Bad Request: "latex" field must be a valid string' });
  }

  // 2. Setup temporary compilation directory
  const tempDirId = uuidv4();
  const tempDir = path.join(__dirname, 'temp', tempDirId);
  const texFilePath = path.join(tempDir, 'input.tex');
  const pdfFilePath = path.join(tempDir, 'input.pdf');

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    // Write the raw LaTeX string to the input.tex file
    fs.writeFileSync(texFilePath, latex);

    // 3. Execute pdflatex
    // -interaction=nonstopmode prevents the prompt from hanging on error
    // -halt-on-error stops at first error
    // -no-shell-escape prevents maliciously crafted latex from executing shell commands
    const command = `pdflatex -interaction=nonstopmode -halt-on-error -no-shell-escape input.tex`;

    exec(command, { cwd: tempDir, timeout: 15000 }, (error, stdout, stderr) => {
      let isPdfReady = false;
      if (fs.existsSync(pdfFilePath)) {
         isPdfReady = true;
      }

      // If there's an error and no PDF was generated, return the error logs
      if (error && !isPdfReady) {
        console.error(`LaTeX compilation failed for ${tempDirId}:`, stderr || stdout);
        
        let logContent = 'No log available';
        const logFilePath = path.join(tempDir, 'input.log');
        if (fs.existsSync(logFilePath)) {
           logContent = fs.readFileSync(logFilePath, 'utf8');
        }
        
        // Clean up synchronously
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        return res.status(500).json({ 
          error: 'Failed to compile LaTeX', 
          details: stdout || stderr,
          log: logContent
        });
      }

      try {
        // Read the PDF as binary
        const pdfBuffer = fs.readFileSync(pdfFilePath);
        
        // Clean up after successful read
        fs.rmSync(tempDir, { recursive: true, force: true });

        // Send binary PDF Response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="resume.pdf"`);
        return res.status(200).send(pdfBuffer);
      } catch (err) {
        console.error('Error reading generated PDF:', err);
        // Clean up
        fs.rmSync(tempDir, { recursive: true, force: true });
        return res.status(500).json({ error: 'Failed to return PDF file' });
      }
    });

  } catch (err) {
    console.error('Exception during compilation step:', err);
    if (fs.existsSync(tempDir)) {
       fs.rmSync(tempDir, { recursive: true, force: true });
    }
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, () => {
  console.log(`LaTeX Compiler Service listening on port ${PORT}`);
});
