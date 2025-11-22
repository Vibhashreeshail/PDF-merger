const PDFMerger = require('pdf-merger-js').default; 
const path = require('path');
const fs = require('fs');

/**
 * Merges multiple PDF files into a single output file.
 *
 * @param {Array<object>} files - An array of Multer file objects, each having a 'path' property.
 * @returns {Promise<string>} The file path to the newly merged PDF.
 */
const mergePDFs = async (files) => {
    // Instantiating the class now works because we accessed the .default export.
    const merger = new PDFMerger(); 

    if (!files || files.length < 2) {
        throw new Error("At least two files are required for merging.");
    }
    
    // Determine the path to save the merged PDF
    const publicDir = path.join(__dirname, 'public');
    const outputPath = path.join(publicDir, 'merged.pdf');

    // Add all uploaded files to the merger
    for (const file of files) {
        // The file.path is the temporary path where Multer stored the file.
        if (!file.path) {
             throw new Error(`File ${file.originalname || "unknown"} is missing a temporary path. Check Multer setup.`);
        }
        
        console.log(`Adding file: ${file.originalname} from path: ${file.path}`);
        await merger.add(file.path); 
    }

    // Save the merged PDF
    await merger.save(outputPath);
    
    // Clean up temporary Multer files
    files.forEach(file => {
        fs.unlink(file.path, (err) => {
            if (err) console.error("Error cleaning up temporary file:", err);
        });
    });

    return outputPath;
}

module.exports = { mergePDFs };