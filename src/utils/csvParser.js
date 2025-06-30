// src/utils/csvParser.js
import Papa from "papaparse";

// Expected header prefixes for validation
const expectedHeaderPrefixes = [
  "Name",
  "Address",
  "Account",
  "Disclaimer",
  "Title",
  "Resource",
  "Meter",
  "Interval",
  "Reading",
  "Reading",
  "Total",
  "Total",
  "UOM",
  "Meter", // Last line needs more validation as it's the column headers
];

/**
 * Validates CSV headers against expected Green Button format
 * @param {string} csvText - Raw CSV text content
 * @returns {object} - { isValid: boolean, errorMessage: string | null }
 */
export const validateCsvHeaders = (csvText) => {
  const lines = csvText.split("\n").slice(0, 14);
  let isValidFormat = true;
  let errorMessage = null;

  for (
    let i = 0;
    i < Math.min(lines.length, expectedHeaderPrefixes.length);
    i++
  ) {
    const expectedWord = expectedHeaderPrefixes[i].trim();
    const firstWord = lines[i].split(",")[0].trim().split(" ")[0].trim();

    if (firstWord !== expectedWord) {
      isValidFormat = false;
      errorMessage = `The CSV file does not match the expected Green Button format. Expected "${expectedWord}" but found "${firstWord}" at line ${i + 1}.`;
      console.error("Error: Missing headers found!", expectedWord);
      break;
    }
  }

  return { isValid: isValidFormat, errorMessage };
};

/**
 * Parses a CSV string using Papa Parse with Green Button specific configuration
 * @param {string} csvText - Raw CSV text to parse
 * @returns {Promise<Array>} - Parsed data array or throws error
 */
export const parseGreenButtonCsv = (csvText) => {
  return new Promise((resolve, reject) => {
    // First validate headers
    const { isValid, errorMessage } = validateCsvHeaders(csvText);

    if (!isValid) {
      reject(new Error(errorMessage));
      return;
    }

    // Then parse with Papa Parse
    Papa.parse(csvText, {
      skipFirstNLines: 13,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          reject(new Error(`Error parsing CSV: ${results.errors[0].message}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(new Error(`Error parsing CSV: ${error.message}`));
      },
    });
  });
};

/**
 * Parses a CSV file object using Papa Parse with Green Button specific configuration
 * @param {File} file - File object to parse
 * @returns {Promise<Array>} - Parsed data array or throws error
 */
export const parseGreenButtonFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    if (!file.name.endsWith(".csv")) {
      reject(new Error("Please select a CSV file only. See instructions."));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const csvText = e.target.result;
        const parsedData = await parseGreenButtonCsv(csvText);
        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading the file."));
    };

    reader.readAsText(file);
  });
};
