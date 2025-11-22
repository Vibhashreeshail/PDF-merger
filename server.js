// Import necessary modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// FIX: Import the merging function from the merge.js file
const { mergePDFs } = require('./merge'); 

const app = express();
const port = 3000;
const uploadsDir = path.join(__dirname, 'uploads');

// Utility to ensure required directories exist
const setupDirectories = () => {
    // Ensure 'public' and 'uploads' directories exist
    const publicDir = path.join(__dirname, 'public');
    [publicDir, uploadsDir, path.join(__dirname, 'templates')].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
    console.log("Required directories (public, uploads, templates) ensured.");
};

setupDirectories();

// Multer setup: store files in a temporary 'uploads/' directory using the absolute path
// This helps prevent the "undefined path" error previously encountered.
const upload = multer({ dest: uploadsDir });


// Serve the HTML file from the templates directory
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "index.html"))
})

// Route to handle PDF merging
// 'pdf' matches the 'name' attribute in index.html.
app.post('/merge', upload.array('pdf', 10), async (req, res, next) => {
  
  if (!req.files || req.files.length < 2) {
    // Cleanup any partial uploads
    if (req.files) {
        req.files.forEach(file => fs.unlink(file.path, (err) => {}));
    }
    return res.status(400).send("Please upload at least two PDF files to merge.");
  }

  try {
    const mergedFilePath = await mergePDFs(req.files); 

    // Send the merged file back to the client
    res.download(mergedFilePath, 'merged.pdf', (err) => {
        if (err) {
            console.error("Error sending file for download:", err);
            res.status(500).send("Error downloading the merged file.");
        }
        // Cleanup the final merged file after download is initiated
        fs.unlink(mergedFilePath, (unlinkErr) => {
            if (unlinkErr) console.error("Error cleaning up merged file:", unlinkErr);
        });
    });

  } catch (error) {
    console.error("PDF Merging Error:", error);
    res.status(500).send("An error occurred during PDF merging: " + error.message);
  }
})

// Start the server
const server = app.listen(port, () => {
  console.log(`PDF Merger app listening on port http://localhost:${port}`)
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please stop the other process or use a different port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1); 
});