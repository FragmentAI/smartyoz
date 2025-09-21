import fs from 'fs';
import path from 'path';

export interface ResumeExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
}

export class ResumeExtractor {
  /**
   * Extract text from resume file
   * Supports PDF, DOC, DOCX, and TXT files with file type detection by magic bytes
   */
  static async extractResumeText(filePath: string): Promise<ResumeExtractionResult> {
    try {
      console.log('📄 Extracting resume text from:', filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'Resume file not found'
        };
      }

      // Detect file type by magic bytes instead of extension
      const detectedType = this.detectFileType(filePath);
      console.log('🔍 Detected file type:', detectedType);

      switch (detectedType) {
        case 'txt':
          return await this.extractFromTextFile(filePath);
        
        case 'pdf':
          return await this.extractFromPdf(filePath);
        
        case 'doc':
          return await this.extractFromDoc(filePath);
          
        case 'docx':
          return await this.extractFromDocx(filePath);
        
        default:
          return {
            success: false,
            error: `Unsupported file type: ${detectedType}. Only PDF, DOC, DOCX, and TXT files are supported.`
          };
      }
    } catch (error) {
      console.error('❌ Resume extraction failed:', error);
      return {
        success: false,
        error: 'Failed to extract text from resume file'
      };
    }
  }

  /**
   * Detect file type by reading magic bytes from file header
   */
  private static detectFileType(filePath: string): string {
    try {
      const buffer = fs.readFileSync(filePath);
      const header = buffer.subarray(0, 10);
      const headerHex = header.toString('hex');
      
      console.log('🔍 File header (first 10 bytes):', headerHex);

      // PDF files start with %PDF
      if (headerHex.startsWith('255044462d')) {
        return 'pdf';
      }
      
      // DOCX files are ZIP archives starting with PK
      if (headerHex.startsWith('504b0304')) {
        return 'docx';
      }
      
      // DOC files start with specific OLE header
      if (headerHex.startsWith('d0cf11e0a1b1') || headerHex.startsWith('0d444f43')) {
        return 'doc';
      }
      
      // Try to detect if it's text (check if mostly printable ASCII)
      const sampleSize = Math.min(buffer.length, 1000);
      let textChars = 0;
      for (let i = 0; i < sampleSize; i++) {
        const byte = buffer[i];
        if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
          textChars++;
        }
      }
      
      if (textChars / sampleSize > 0.8) {
        return 'txt';
      }
      
      return 'unknown';
    } catch (error) {
      console.error('Error detecting file type:', error);
      return 'unknown';
    }
  }

  /**
   * Extract text from PDF files using pdf-parse
   */
  private static async extractFromPdf(filePath: string): Promise<ResumeExtractionResult> {
    try {
      console.log('📋 Starting PDF extraction...');
      
      // Dynamic import to avoid module loading issues
      const pdfParse = (await import('pdf-parse')).default;
      
      const dataBuffer = fs.readFileSync(filePath);
      console.log('📋 PDF file size:', dataBuffer.length, 'bytes');
      
      const data = await pdfParse(dataBuffer);
      console.log('🔍 PDF parse completed, text length:', data.text?.length || 0);
      
      if (!data.text || data.text.trim().length === 0) {
        return {
          success: false,
          error: 'PDF file contains no readable text'
        };
      }

      const extractedText = data.text.trim();
      
      // Log the full extracted text as requested
      console.log('📄 EXTRACTED PDF TEXT (FULL):');
      console.log('=====================================');
      console.log(extractedText);
      console.log('=====================================');

      return {
        success: true,
        text: extractedText
      };
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      return {
        success: false,
        error: 'Failed to extract text from PDF file'
      };
    }
  }

  /**
   * Extract text from DOCX files using mammoth
   */
  private static async extractFromDocx(filePath: string): Promise<ResumeExtractionResult> {
    try {
      console.log('📋 Starting DOCX extraction...');
      
      // Dynamic import to avoid module loading issues
      const mammoth = await import('mammoth');
      
      const result = await mammoth.extractRawText({ path: filePath });
      console.log('🔍 DOCX parse completed, text length:', result.value?.length || 0);
      
      if (!result.value || result.value.trim().length === 0) {
        return {
          success: false,
          error: 'DOCX file contains no readable text'
        };
      }

      const extractedText = result.value.trim();
      
      // Log the full extracted text as requested
      console.log('📄 EXTRACTED DOCX TEXT (FULL):');
      console.log('=====================================');
      console.log(extractedText);
      console.log('=====================================');

      return {
        success: true,
        text: extractedText
      };
    } catch (error) {
      console.error('❌ DOCX extraction error:', error);
      return {
        success: false,
        error: 'Failed to extract text from DOCX file'
      };
    }
  }

  /**
   * Extract text from DOC files using mammoth
   */
  private static async extractFromDoc(filePath: string): Promise<ResumeExtractionResult> {
    try {
      console.log('📋 Starting DOC extraction...');
      
      // Dynamic import to avoid module loading issues
      const mammoth = await import('mammoth');
      
      const result = await mammoth.extractRawText({ path: filePath });
      console.log('🔍 DOC parse completed, text length:', result.value?.length || 0);
      
      if (!result.value || result.value.trim().length === 0) {
        return {
          success: false,
          error: 'DOC file contains no readable text'
        };
      }

      const extractedText = result.value.trim();
      
      // Log the full extracted text as requested
      console.log('📄 EXTRACTED DOC TEXT (FULL):');
      console.log('=====================================');
      console.log(extractedText);
      console.log('=====================================');

      return {
        success: true,
        text: extractedText
      };
    } catch (error) {
      console.error('❌ DOC extraction error:', error);
      return {
        success: false,
        error: 'Failed to extract text from DOC file'
      };
    }
  }

  /**
   * Extract text from plain text files
   */
  private static async extractFromTextFile(filePath: string): Promise<ResumeExtractionResult> {
    try {
      console.log('📋 Starting TXT extraction...');
      
      const text = fs.readFileSync(filePath, 'utf8');
      console.log('🔍 TXT file read, length:', text?.length || 0);
      
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'Text file is empty'
        };
      }

      const extractedText = text.trim();
      
      // Log the full extracted text as requested
      console.log('📄 EXTRACTED TXT TEXT (FULL):');
      console.log('=====================================');
      console.log(extractedText);
      console.log('=====================================');

      return {
        success: true,
        text: extractedText
      };
    } catch (error) {
      console.error('❌ TXT extraction error:', error);
      return {
        success: false,
        error: 'Failed to read text file'
      };
    }
  }
}
