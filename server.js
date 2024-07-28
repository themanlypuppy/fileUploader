const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Ensure the upload directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up storage for uploaded chunks
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Route to handle chunked file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = path.join(uploadDir, req.file.originalname);

  // Append the chunk to the file
  fs.appendFileSync(filePath, req.file.buffer);

  res.send('Chunk uploaded successfully');
});

// Route to assemble chunks
app.post('/assemble', (req, res) => {
  const { filename, chunkCount } = req.body;
  const filePath = path.join(uploadDir, filename);
  const writeStream = fs.createWriteStream(filePath);

  for (let i = 0; i < chunkCount; i++) {
    const chunkPath = `${filePath}.part${i}`;
    const data = fs.readFileSync(chunkPath);
    writeStream.write(data);
    fs.unlinkSync(chunkPath); // Delete chunk after appending
  }

  writeStream.end();
  res.send('File assembled successfully');
});

// Add the ping route
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running at http://localhost:${port}`);
});
