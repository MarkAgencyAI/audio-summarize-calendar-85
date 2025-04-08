
/**
 * Formats math expressions by ensuring proper spacing and structure
 * for common math notation patterns.
 */
export function formatMathExpression(text: string): string {
  if (!text) return "";
  
  // Ensure input is a string
  const textStr = String(text);
  
  // Replace multiple newlines with just two (for paragraph breaks)
  let formatted = textStr.replace(/\n{3,}/g, "\n\n");
  
  // Make sure fractions have proper spacing
  formatted = formatted.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}");
  
  // Format expressions that might not be properly wrapped in delimiters
  const mathRegex = /\\\(|\\\)/g;
  if (!mathRegex.test(formatted)) {
    // Add delimiters to mathematical expressions that appear to need them
    formatted = formatted.replace(/(\d+\s*[+\-*/÷^]\s*\d+)/g, "\\($1\\)");
    formatted = formatted.replace(/(\d+\s*=\s*\d+)/g, "\\($1\\)");
  }
  
  return formatted;
}
