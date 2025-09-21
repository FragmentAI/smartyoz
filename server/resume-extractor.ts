import fs from 'fs';
import path from 'path';
// @ts-ignore
import pdf from 'pdf-parse-fork';
import * as mammoth from 'mammoth';

export interface ResumeExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
}

export class ResumeExtractor {
  /**
   * Extract text from a resume file buffer.
   * Supports PDF, DOC, DOCX, and TXT files with file type detection by magic bytes.
   */
  static async extractResumeText(fileBuffer: Buffer): Promise<ResumeExtractionResult> {
    try {
      console.log('📄 Extracting resume text from buffer...');

      // Detect file type by magic bytes from the buffer
      const detectedType = this.detectFileType(fileBuffer);
      console.log('🔍 Detected file type:', detectedType);

      switch (detectedType) {
        case 'txt':
          return await this.extractFromTextBuffer(fileBuffer);
        
        case 'pdf':
          return await this.extractFromPdfBuffer(fileBuffer);
        
        case 'doc':
        case 'docx':
          return await this.extractFromDocxBuffer(fileBuffer);
        
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
   * Detect file type by reading magic bytes from a buffer.
   */
  private static detectFileType(buffer: Buffer): string {
    try {
      const header = buffer.subarray(0, 10);
      const headerHex = header.toString('hex');
      
      console.log('🔍 File header (first 10 bytes):', headerHex);

      if (headerHex.startsWith('25504446')) { // %PDF
        return 'pdf';
      }
      if (headerHex.startsWith('504b0304')) { // PK.. (zip)
        return 'docx';
      }
      if (headerHex.startsWith('d0cf11e0a1b1')) { // OLE Compound File
        return 'doc';
      }
      
      // Fallback to check for text-like content
      const sample = buffer.toString('utf8', 0, 500);
      const nonPrintable = /[^\x20-\x7E\t\n\r]/g;
      const nonPrintableRatio = (sample.match(nonPrintable) || []).length / sample.length;
      if (nonPrintableRatio < 0.1) {
        return 'txt';
      }
      
      return 'unknown';
    } catch (error) {
      console.error('Error detecting file type:', error);
      return 'unknown';
    }
  }

  /**
   * Extract text from PDF files using pdf-parse-fork.
   */
  private static async extractFromPdfBuffer(buffer: Buffer): Promise<ResumeExtractionResult> {
    try {
      console.log('📋 Starting PDF extraction from buffer with pdf-parse-fork...');
      const data = await pdf(buffer);
      console.log('✅ PDF extraction successful.');
      return {
        success: true,
        text: data.text,
      };
    } catch (error) {
      console.error('❌ PDF extraction with pdf-parse-fork failed:', error);
      return {
        success: false,
        error: 'Failed to extract text from PDF file using pdf-parse-fork',
      };
    }
  }

  /**
   * Extract text from DOCX/DOC files using mammoth.
   */
  private static async extractFromDocxBuffer(buffer: Buffer): Promise<ResumeExtractionResult> {
    try {
      console.log('📋 Starting DOCX/DOC extraction from buffer...');
      const result = await mammoth.extractRawText({ buffer });
      
      console.log('🔍 DOCX/DOC parse completed, text length:', result.value?.length || 0);
      
      if (!result.value || result.value.trim().length === 0) {
        return { success: false, error: 'DOCX/DOC file contains no readable text' };
      }

      const extractedText = result.value.trim();
      console.log('📄 EXTRACTED DOCX/DOC TEXT (FULL):');
      console.log('=====================================');
      console.log(extractedText);
      console.log('=====================================');

      return { success: true, text: extractedText };
    } catch (error) {
      console.error('❌ DOCX/DOC extraction error:', error);
      return { success: false, error: 'Failed to extract text from DOCX/DOC file' };
    }
  }

  /**
   * Extract text from plain text files from a buffer.
   */
  private static async extractFromTextBuffer(buffer: Buffer): Promise<ResumeExtractionResult> {
    try {
      console.log('📋 Starting TXT extraction from buffer...');
      const text = buffer.toString('utf8');
      
      console.log('🔍 TXT file read, length:', text?.length || 0);
      
      if (!text || text.trim().length === 0) {
        return { success: false, error: 'Text file is empty' };
      }

      const extractedText = text.trim();
      console.log('📄 EXTRACTED TXT TEXT (FULL):');
      console.log('=====================================');
      console.log(extractedText);
      console.log('=====================================');

      return { success: true, text: extractedText };
    } catch (error) {
      console.error('❌ TXT extraction error:', error);
      return { success: false, error: 'Failed to read text file' };
    }
  }
}
