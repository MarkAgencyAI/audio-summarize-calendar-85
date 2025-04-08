
import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  content: string;
  className?: string;
}

export function MathRenderer({ content, className = "" }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Process the text to find math expressions within \( \) delimiters
    const processedContent = content.split(/(\\\(.*?\\\))/g).map((part, index) => {
      if (part.startsWith("\\(") && part.endsWith("\\)")) {
        // Extract the math expression from between \( \)
        const mathExpression = part.substring(2, part.length - 2);
        try {
          // Render the math expression using KaTeX
          const html = katex.renderToString(mathExpression.trim(), {
            throwOnError: false,
            displayMode: false
          });
          return `<span class="katex-inline">${html}</span>`;
        } catch (error) {
          console.error("Error rendering math:", error);
          return part;
        }
      } else {
        // Replace line breaks with <br> tags
        return part.replace(/\n/g, "<br>");
      }
    }).join("");

    // Set the processed content as innerHTML
    containerRef.current.innerHTML = processedContent;
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={`math-renderer ${className}`}
    />
  );
}
