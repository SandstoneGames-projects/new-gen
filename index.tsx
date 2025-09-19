/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const APP_STYLES = `
  :root {
    --background-dark: #121212;
    --surface-color: #1e1e1e;
    --primary-color: #6a5acd;
    --primary-hover-color: #8374e6;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --border-color: #333333;
    --success-color: #4caf50;
    --error-color: #f44336;
    --font-family: 'Inter', sans-serif;

    /* Style Tag Colors */
    --style-hero-color: #6a5acd;
    --style-closeup-color: #4682b4;
    --style-lifestyle-color: #3cb371;
    --style-studio-color: #888888;
    --style-flatlay-color: #DAA520;
    --style-ecommerce-color: #4169E1;
    --style-whitebg-color: #B0C4DE;
  }

  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  body {
    font-family: var(--font-family);
    background-color: var(--background-dark);
    color: var(--text-primary);
    font-size: 16px;
  }

  /* --- Main App Container --- */
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--surface-color);
  }

  .action-buttons-right {
    display: flex;
    gap: 1rem;
  }

  .upload-options {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
  }

  .or-divider {
      font-weight: 600;
      color: var(--text-secondary);
      margin: 0.5rem 0 !important; /* Override default p margin */
  }

  .upload-box {
    border: 2px dashed var(--border-color);
    border-radius: 12px;
    padding: 3rem 4rem;
    cursor: pointer;
    transition: border-color 0.2s ease;
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 0;
  }

  .upload-box::before {
    content: "";
    position: absolute;
    z-index: -2;
    inset: -3px;
    border-radius: 15px;
    background: conic-gradient(
      from var(--angle),
      transparent 20%,
      rgba(106, 90, 205, 0.2),
      var(--primary-color),
      rgba(106, 90, 205, 0.2),
      transparent 40%
    );
    animation: rotate-glow 4s linear infinite;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    filter: blur(4px);
  }

  .upload-box::after {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    border-radius: 12px;
    background-color: var(--surface-color);
    transition: background-color 0.2s ease;
  }

  .upload-box:not(.disabled)::before {
      opacity: 0.6;
  }

  @keyframes rotate-glow {
    to {
      --angle: 360deg;
    }
  }

  .upload-box:hover:not(.disabled) {
    border-color: var(--primary-color);
  }

  .upload-box:hover:not(.disabled)::after {
    background-color: #2a2a2a;
  }

  .upload-box.dragging {
    border-color: var(--primary-color);
    border-style: solid;
  }

  .upload-box.dragging::after {
    background-color: rgba(106, 90, 205, 0.1);
  }

  .upload-box.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  .upload-box.disabled:hover {
    border-color: var(--border-color);
  }

  .upload-box.disabled:hover::after {
    background-color: var(--surface-color);
  }

  .upload-box svg {
    width: 50px;
    height: 50px;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  .upload-box span {
    font-weight: 600;
    color: var(--primary-color);
    transition: color 0.2s ease;
  }

  .upload-box.dragging span {
      color: var(--primary-hover-color);
  }

  /* --- Editor Screen --- */
  .editor-screen {
    display: grid;
    grid-template-columns: 320px 1fr 320px;
    grid-template-rows: 1fr;
    flex: 1;
    min-height: 0;
    width: 100%;
    gap: 1rem;
    padding: 1rem;
  }

  /* --- Left Sidebar (Styles) --- */
  .styles-sidebar {
    background-color: var(--surface-color);
    border-radius: 12px;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .styles-sidebar h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .analysis-status {
    padding: 0.75rem;
    background-color: rgba(106, 90, 205, 0.2);
    border-radius: 8px;
    margin-bottom: 1rem;
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  .styles-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .style-card {
    background-color: var(--background-dark);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    overflow: hidden;
  }

  .style-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    border-color: var(--primary-color);
  }

  .style-card.active {
    border-color: var(--primary-color);
    box-shadow: 0 0 15px rgba(106, 90, 205, 0.5);
  }

  .style-card.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none; /* Prevents hover effects and clicks */
  }

  .style-card img {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    display: block;
  }

  .style-card-content {
    padding: 1rem;
  }

  .style-card-content h3 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .style-card-content p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  /* --- Center Canvas --- */
  .canvas-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 0; /* Prevents flexbox overflow */
  }

  .canvas {
    width: 100%;
    flex-grow: 1;
    min-height: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--surface-color);
    border-radius: 12px;
    overflow: hidden;
    padding: 1rem;
  }

  .canvas img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    background-color: white;
    border-radius: 4px;
  }

  /* --- Initial Uploader (inside Canvas) --- */
  .canvas-upload-view {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    text-align: center;
    height: 100%;
  }

  .canvas-upload-view h1 {
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .canvas-upload-view p {
    font-size: 1.1rem;
    color: var(--text-secondary);
    margin-bottom: 2rem;
    max-width: 500px;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, opacity 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
  }

  .btn-primary {
    background-color: var(--primary-color);
    color: var(--text-primary);
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--primary-hover-color);
  }

  .btn-secondary {
    background-color: var(--surface-color);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }
  .btn-secondary:hover:not(:disabled) {
    background-color: #2a2a2a;
  }


  /* --- Right Sidebar (Results) --- */
  .results-sidebar {
    background-color: var(--surface-color);
    border-radius: 12px;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .results-sidebar h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .results-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .result-thumbnail {
    aspect-ratio: 1 / 1;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s ease, transform 0.2s ease;
    overflow: hidden;
    position: relative;
    background-color: var(--background-dark);
  }

  .result-thumbnail:hover {
    transform: scale(1.05);
  }

  .result-thumbnail.active {
    border-color: var(--primary-color);
  }

  .result-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .style-tag {
    position: absolute;
    bottom: 6px;
    left: 6px;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  }

  .style-tag[data-style-id="hero"] { background-color: var(--style-hero-color); }
  .style-tag[data-style-id="closeup"] { background-color: var(--style-closeup-color); }
  .style-tag[data-style-id="lifestyle"] { background-color: var(--style-lifestyle-color); }
  .style-tag[data-style-id="studio"] { background-color: var(--style-studio-color); }
  .style-tag[data-style-id="flatlay"] { background-color: var(--style-flatlay-color); }
  .style-tag[data-style-id="ecommerce"] { background-color: var(--style-ecommerce-color); }
  .style-tag[data-style-id="whitebg"] { background-color: var(--style-whitebg-color); color: #121212; text-shadow: none; }

  /* --- Loading Spinner --- */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    flex-direction: column;
    gap: 1rem;
    color: var(--text-primary);
  }

  .spinner {
    width: 56px;
    height: 56px;
    border: 8px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .thumbnail-spinner-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .thumbnail-spinner-container .spinner {
    width: 32px;
    height: 32px;
    border-width: 4px;
  }


  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }


  /* --- Modal --- */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }

  .modal-content {
    background-color: var(--surface-color);
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .modal-content h3 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  .modal-content p {
    margin-bottom: 1.5rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .modal-content a {
      color: var(--primary-color);
      text-decoration: none;
      display: inline-block;
      margin-top: -0.5rem;
      margin-bottom: 1rem;
  }

  .modal-content a:hover {
      text-decoration: underline;
  }

  .api-key-input {
      width: 100%;
      background-color: var(--background-dark);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 8px;
      padding: 0.75rem;
      font-family: var(--font-family);
      font-size: 1rem;
      margin-bottom: 1.5rem;
  }

  .modal-content textarea {
      width: 100%;
      min-height: 100px;
      background-color: var(--background-dark);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 8px;
      padding: 0.75rem;
      font-family: var(--font-family);
      font-size: 1rem;
      resize: vertical;
      margin-bottom: 1rem;
  }

  .modal-content textarea::placeholder {
      transition: opacity 0.5s ease-in-out;
      color: var(--text-secondary);
  }

  .modal-content textarea.fade-placeholder::placeholder {
      opacity: 0;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .modal-upload .upload-box {
    padding: 2rem 3rem;
  }

  .modal-upload .upload-box::after {
    background-color: var(--background-dark);
  }

  .modal-upload .upload-box svg {
      width: 40px;
      height: 40px;
      margin-bottom: 0.75rem;
  }

  /* --- Animations --- */
  @keyframes magic-shimmer {
    0%, 100% {
      filter: drop-shadow(0 0 3px var(--primary-color));
      transform: scale(1);
    }
    50% {
      filter: drop-shadow(0 0 6px gold) drop-shadow(0 0 2px white);
      transform: scale(1.1);
    }
  }

  .improve-icon-animated {
    animation: magic-shimmer 2.5s ease-in-out infinite;
    will-change: filter, transform;
  }

  /* --- Responsive Design --- */
  @media (max-width: 1024px) {
    .editor-screen {
      grid-template-columns: 280px 1fr;
      grid-template-rows: 1fr auto;
      padding: 0.5rem;
    }
    .results-sidebar {
      grid-row: 2;
      grid-column: 1 / 3;
      overflow-y: initial;
    }
    .results-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 768px) {
    .app-container {
      overflow-y: auto;
    }
    .editor-screen {
      display: flex;
      flex-direction: column;
      height: auto;
    }
    .styles-sidebar, .results-sidebar {
      height: auto;
      max-height: 50vh;
    }
    .canvas-container {
      height: 40vh;
      min-height: 300px;
    }
    .results-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
    .styles-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
  }

  /* --- Custom Scrollbar --- */
  /* For Webkit-based browsers (Chrome, Safari, Edge) */
  .styles-sidebar::-webkit-scrollbar,
  .results-sidebar::-webkit-scrollbar {
    width: 8px;
  }

  .styles-sidebar::-webkit-scrollbar-track,
  .results-sidebar::-webkit-scrollbar-track {
    background: transparent;
  }

  .styles-sidebar::-webkit-scrollbar-thumb,
  .results-sidebar::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 10px;
    transition: background-color 0.2s ease;
  }

  .styles-sidebar::-webkit-scrollbar-thumb:hover,
  .results-sidebar::-webkit-scrollbar-thumb:hover {
    background-color: var(--primary-color);
  }

  /* For Firefox */
  .styles-sidebar,
  .results-sidebar {
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) var(--surface-color);
  }
`;


const isMobileDevice = () => {
    return /Mobi|Android/i.test(navigator.userAgent);
};

const PHOTO_STYLES = [
  {
    id: 'hero',
    name: 'Hero Shot',
    description: 'A visually striking shot that showcases your product in its best light.',
    prompt: 'Generate a visually stunning, high-impact hero shot of the product. The product must be the central focus, captured with dramatic, high-contrast lighting that accentuates its form and texture. The background should be clean yet powerful, complementing the product without distraction. The overall mood should be premium, aspirational, and cinematic.',
    preview: 'https://i.imgur.com/2fq4VQy.jpeg',
  },
  {
    id: 'closeup',
    name: 'Close-up Photography',
    description: 'Highlights the fine details, texture, and materials of your product.',
    prompt: "Create a compelling macro-style, extreme close-up shot of the provided product. Focus on the most intricate details, textures, and materials. The lighting must be precise, highlighting these specific features to reveal the product's quality and craftsmanship. The composition should be tight, artistic, and abstract.",
    preview: 'https://i.imgur.com/FSagWNQ.jpeg',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Photography',
    description: 'Shows your product in a real-life setting to connect with customers.',
    prompt: 'Create a realistic and aspirational lifestyle scene featuring this product in a natural context of use. The scene should tell a story and evoke a specific mood (e.g., cozy morning, busy city life, relaxing vacation). Ensure the lighting is natural and the atmosphere is authentic. The product should be seamlessly integrated into the environment, looking like it truly belongs there.',
    preview: 'https://i.imgur.com/wE21foO.jpeg',
  },
  {
    id: 'studio',
    name: 'Studio Photography',
    description: 'Clean and polished look with consistent lighting and background.',
    prompt: 'Generate a professional studio photograph of the product, perfectly presented. Use clean, even, and soft lighting to eliminate harsh shadows and create gentle gradients. The background should be a seamless, solid, neutral color (like light gray, #f0f0f0) to ensure the product is the sole focus. The overall look must be polished, sharp, and consistent.',
    preview: 'https://i.imgur.com/c4KGr9L.jpeg',
  },
  {
    id: 'flatlay',
    name: 'Flat-Lay Photography',
    description: 'Captures products from above for a clean, stylish composition.',
    prompt: 'Create a stylish and well-composed flat-lay photograph, shot from a top-down perspective (90-degree angle). Arrange the product neatly on a clean, textured surface (like wood, marble, or linen) alongside a few complementary, aesthetically pleasing props that enhance its story and color palette. The lighting should be bright, soft, and even across the entire composition.',
    preview: 'https://i.imgur.com/uWNlzzA.png',
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Photography',
    description: 'Clear, accurate shots that follow platform-specific guidelines.',
    prompt: 'Generate a clear and accurate e-commerce product shot optimized for marketplaces like Amazon or Shopify. The product must be the sole focus, sharply in focus from edge to edge, and well-lit to show its true colors and details. Styling should be minimal to none. The background should be simple and non-distracting, often a light neutral gray or a subtle gradient.',
    preview: 'https://i.imgur.com/AbwB5uB.jpeg',
  },
  {
    id: 'whitebg',
    name: 'White Background Shots',
    description: 'The e-commerce gold standard. Clean, minimal, and distraction-free.',
    prompt: "Isolate the product from its current background and place it on a completely pure, seamless white background (#FFFFFF). The lighting on the product should be clean, bright, and diffused to eliminate all but the softest contact shadows, ensuring the product's colors and details are accurately represented. The final image should be suitable for a high-end e-commerce product listing.",
    preview: 'https://i.imgur.com/3Hn6MM1.jpeg',
  },
];

const ThumbnailSpinner = () => (
    <div className="thumbnail-spinner-container">
        <div className="spinner" />
    </div>
);

const Modal = ({ title, children, actions, showClose = true }) => (
  <div className="modal-overlay" role="dialog" aria-modal="true">
    <div className="modal-content">
      <h3>{title}</h3>
      {children}
      {actions && <div className="modal-actions">{actions}</div>}
    </div>
  </div>
);


type GeneratedImage = {
  id: string;
  src: string | null;
  style: string;
  styleId: string;
  status: 'generating' | 'completed' | 'error';
};

const App = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState(-1);
  const [productDescription, setProductDescription] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{type: string, data?: any} | null>(null);
  const [improvePrompt, setImprovePrompt] = useState('');
  
  const placeholderRef = useRef<HTMLTextAreaElement>(null);
  const [currentPlaceholder, setCurrentPlaceholder] = useState('e.g., Make the lighting more dramatic...');

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = APP_STYLES;
    document.head.appendChild(styleElement);

    return () => {
        document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    if (modal?.type !== 'improve') return;

    const originalPlaceholders = [
        "e.g., Make the lighting more dramatic...",
        "e.g., Change the background to a lush forest.",
        "e.g., Add a reflection on a glossy black floor.",
        "e.g., Give it a vintage, 1970s film-like quality.",
        "e.g., Place the product on a pile of coffee beans.",
        "e.g., Surround it with smoke and neon lights.",
        "e.g., Change the background to a minimalist concrete wall."
    ];
    
    const placeholders = [...originalPlaceholders].sort(() => Math.random() - 0.5);
    let placeholderIndex = 0;
    setCurrentPlaceholder(placeholders[0]);


    const intervalId = setInterval(() => {
        const textarea = placeholderRef.current;
        if (!textarea) return;

        textarea.classList.add('fade-placeholder');

        setTimeout(() => {
            placeholderIndex = (placeholderIndex + 1) % placeholders.length;
            setCurrentPlaceholder(placeholders[placeholderIndex]);
            textarea.classList.remove('fade-placeholder');
        }, 500);

    }, 2500);

    return () => {
        clearInterval(intervalId);
        setCurrentPlaceholder(originalPlaceholders[0]);
    };
  }, [modal?.type]);

  const analyzeImage = async (base64Image: string) => {
      setIsAnalyzing(true);
      setError(null);
      try {
        if (!base64Image) throw new Error("Source image is missing.");
        
        const [header, data] = base64Image.split(';base64,');
        if (!header || !data) throw new Error("Invalid base64 image format.");
        const mimeType = header.split(':')[1];

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              { inlineData: { data, mimeType } },
              { text: 'Analyze the image and provide a concise, descriptive name for the product shown. Focus on what the item is, its color, and any distinct patterns. For example: "a bottle of red hot sauce with a green cap" or "a blue patterned phone case". Output only the product name.' },
            ],
          },
        });

        const description = response.text.trim();
        if (!description) {
            throw new Error("Could not identify the product in the image.");
        }
        setProductDescription(description);

      } catch (err) {
        console.error("Analysis Error:", err);
        setError(`Failed to analyze the product. You can still generate images, but prompts will be less specific. Error: ${err.message}`);
      } finally {
        setIsAnalyzing(false);
      }
    };
    
  const processUploadedFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setUploadedImage(imageData);
        setMainImage(imageData);
        setActiveThumbnailIndex(-1);
        setProductDescription('');
        setError(null);
        setModal(null);
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const generateImage = useCallback(async (base64Image: string, prompt: string) => {
    try {
      if (!base64Image) throw new Error("Source image is missing.");
      
      const [header, data] = base64Image.split(';base64,');
      if (!header || !data) throw new Error("Invalid base64 image format.");
      const mimeType = header.split(':')[1];
      
      const finalPrompt = `${prompt}. Ensure the final output image is a square with a 1:1 aspect ratio.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [
            { inlineData: { data, mimeType } },
            { text: finalPrompt },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image was generated by the API.");
    } catch (err) {
      console.error("API Error:", err);
      setError(`Failed to generate image. ${err.message}`);
      return null;
    }
  }, []);

  const getContextualPrompt = async (stylePrompt: string, productDesc: string) => {
      try {
          const creativeDirectionPrompt = `You are a creative director for a marketing agency. Your task is to enhance a generic photography prompt to make it specific and compelling for a particular product.

Generic Prompt: "${stylePrompt}"
Product Description: "${productDesc}"

Based on the product, rewrite the generic prompt to create a specific, branded, and engaging scene. For example, if the product is 'hot sauce', a lifestyle prompt could be about drizzling it on chicken wings at a barbecue. Be creative and detailed. Output only the new, rewritten prompt.`;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: creativeDirectionPrompt,
          });
          return response.text.trim();
      } catch(err) {
          console.error("Failed to get contextual prompt, falling back to original.", err);
          return stylePrompt;
      }
  };

  const getDiversePrompts = async (basePrompt: string) => {
    try {
        const promptVariationRequest = `Based on the following creative direction, generate exactly 4 distinct and varied photography prompts. Each should explore a different angle, lighting, or composition to provide a range of creative options.

Creative Direction: "${basePrompt}"

Return the 4 prompts as a JSON array of strings. For example: ["prompt 1", "prompt 2", "prompt 3", "prompt 4"].`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptVariationRequest,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: 'A unique photography prompt variation.'
                    },
                },
            },
        });
        
        const jsonResponse = JSON.parse(response.text);

        if (Array.isArray(jsonResponse) && jsonResponse.length > 0) {
            const prompts = [];
            for (let i = 0; i < 4; i++) {
                prompts.push(jsonResponse[i % jsonResponse.length]);
            }
            return prompts;
        }

        console.warn("Could not generate 4 diverse prompts, falling back to original.");
        return Array(4).fill(basePrompt);
    } catch (err) {
        console.error("Error generating diverse prompts:", err);
        return Array(4).fill(basePrompt);
    }
  };

  const handleGenerateStyle = (style) => {
    if (!uploadedImage) return;
    setModal(null);
  
    const placeholders: GeneratedImage[] = Array(4).fill(null).map(() => ({
      id: crypto.randomUUID(),
      src: null,
      style: style.name,
      styleId: style.id,
      status: 'generating',
    }));
  
    setGeneratedImages(prev => [...placeholders, ...prev]);
  
    const processGeneration = async () => {
      const basePrompt = productDescription
        ? await getContextualPrompt(style.prompt, productDescription)
        : style.prompt;
  
      const diversePrompts = await getDiversePrompts(basePrompt);
  
      let isFirstSuccessfulInBatch = true;
  
      placeholders.forEach((placeholder, index) => {
        generateImage(uploadedImage, diversePrompts[index])
          .then(result => {
            setGeneratedImages(currentImages => {
              const newImages = currentImages.map(img => {
                if (img.id === placeholder.id) {
                  const isSuccess = !!result;
                  return { ...img, src: result, status: isSuccess ? 'completed' : 'error' } as GeneratedImage;
                }
                return img;
              });
  
              if (result && isFirstSuccessfulInBatch) {
                isFirstSuccessfulInBatch = false;
                setMainImage(result);
                const newIndex = newImages.findIndex(img => img.id === placeholder.id);
                if (newIndex !== -1) {
                  setActiveThumbnailIndex(newIndex);
                }
              }
              return newImages;
            });
          });
      });
    };
  
    processGeneration();
  };

  const handleImproveImage = async () => {
    if (!improvePrompt.trim()) return;
    setModal(null);
    
    const activeImageObject = generatedImages[activeThumbnailIndex];
    if (!activeImageObject || activeImageObject.status !== 'completed') {
        setError("Please select a completed image to improve.");
        return;
    }

    const imageToImproveId = activeImageObject.id;
    const originalSrc = activeImageObject.src!;

    setGeneratedImages(prev => prev.map(img => 
        img.id === imageToImproveId ? { ...img, status: 'generating' } : img
    ));

    const result = await generateImage(originalSrc, improvePrompt);

    setGeneratedImages(prev => prev.map((img, index) => {
        if (img.id === imageToImproveId) {
            const isSuccess = !!result;
            const newSrc = result || originalSrc;
            
            if (isSuccess && activeThumbnailIndex === index) {
                setMainImage(newSrc);
            }

            return { ...img, src: newSrc, status: isSuccess ? 'completed' : 'error' };
        }
        return img;
    }));

    setImprovePrompt('');
  };

  const handleDownload = () => {
    if (!mainImage) return;
    const link = document.createElement('a');
    link.href = mainImage;
    link.download = `product-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNewProduct = () => {
    setModal({ type: 'newProduct' });
  };

  const openConfirmationModal = (style) => {
    setModal({ type: 'confirm', data: style });
  };

  const openImproveModal = () => {
    setModal({ type: 'improve' });
  };
  
  const handleThumbnailClick = (image: GeneratedImage, index: number) => {
      if (image.status === 'completed' && image.src) {
          setMainImage(image.src);
          setActiveThumbnailIndex(index);
      }
  };

  const isActionDisabled = !mainImage || !generatedImages.length || generatedImages[activeThumbnailIndex]?.status !== 'completed';

  const renderModal = () => {
    if (!modal) return null;

    switch (modal.type) {
      case 'newProduct':
        return (
          <Modal
            title="Start New Project"
            actions={<button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>}
          >
            <p>This will start a new session with a new product image. Your current results will be kept.</p>
            <div className="upload-options modal-upload">
              <label 
                htmlFor="modal-file-upload" 
                className={`upload-box ${isDragging ? 'dragging' : ''}`}
                aria-label="Upload product image"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                <div>Click to <span>upload a file</span> or drag and drop</div>
              </label>
              <input id="modal-file-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>
          </Modal>
        );

      case 'confirm':
        const style = modal.data;
        return (
          <Modal
            title="Confirm Generation"
            actions={(
              <>
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => handleGenerateStyle(style)}>Generate</button>
              </>
            )}
          >
            <p>This will generate 4 new images based on the "{style.name}" style and will cost 4 credits. Are you sure you want to proceed?</p>
          </Modal>
        );
      
      case 'improve':
        return (
          <Modal
            title="Improve Image"
            actions={(
              <>
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleImproveImage} disabled={!improvePrompt.trim()}>Regenerate</button>
              </>
            )}
          >
            <>
              <p>Describe the changes you'd like to see. For example, "Change the beach background to NYC".</p>
              <textarea 
                  ref={placeholderRef}
                  value={improvePrompt} 
                  onChange={(e) => setImprovePrompt(e.target.value)}
                  placeholder={currentPlaceholder}
                  aria-label="Improvement prompt"
              />
            </>
          </Modal>
        );

      default:
        return null;
    }
  }


  return (
    <div className="app-container">
      {renderModal()}

      <header className="app-header">
        <button className="btn btn-secondary" onClick={handleNewProduct} aria-label="Start with a new product">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          New Product
        </button>
        <div className="action-buttons-right">
            <button className="btn btn-secondary" onClick={handleDownload} disabled={isActionDisabled} aria-label="Download current image">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              Download
            </button>
            <button 
                className="btn btn-primary" 
                onClick={openImproveModal} 
                disabled={isActionDisabled}
                aria-label="Improve current image"
            >
              <svg className="improve-icon-animated" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5l.813 2.846a4.5 4.5 0 003.09 3.09L24 18.75l-2.846.813a4.5 4.5 0 00-3.09 3.09L18 24.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L11.25 18l2.846-.813a4.5 4.5 0 003.09-3.09L18 13.5z" /></svg>
              Improve
            </button>
        </div>
      </header>
      <main className="editor-screen">
        <aside className="styles-sidebar">
          <h2>Choose a Style</h2>
          {isAnalyzing && <p className="analysis-status">Analyzing product to create better prompts...</p>}
          <div className="styles-grid">
            {PHOTO_STYLES.map(style => (
              <div 
                key={style.id} 
                className={`style-card ${!uploadedImage ? 'disabled' : ''}`}
                onClick={() => uploadedImage && openConfirmationModal(style)} 
                role="button" 
                tabIndex={!uploadedImage ? -1 : 0} 
                aria-label={`Select ${style.name} style`}
                aria-disabled={!uploadedImage}
              >
                <img src={style.preview} alt={`${style.name} preview`} />
                <div className="style-card-content">
                  <h3>{style.name}</h3>
                  <p>{style.description}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="canvas-container">
          <div className="canvas">
            {!uploadedImage ? (
                <div className="canvas-upload-view">
                    <h1>AI Product Photography Studio</h1>
                    <p>Transform your product photos into stunning, professional-grade marketing assets in seconds. Upload an image to get started.</p>
                    <div className="upload-options">
                        <label 
                          htmlFor="file-upload" 
                          className={`upload-box ${isDragging ? 'dragging' : ''}`}
                          aria-label="Upload product image"
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                          <div>Click to <span>upload a file</span> or drag and drop</div>
                        </label>
                        <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </div>
                </div>
            ) : (
                mainImage && <img src={mainImage} alt="Main product view" />
            )}
          </div>
        </section>

        <aside className="results-sidebar">
          <h2>Results</h2>
          <div className="results-grid">
            {generatedImages.map((image, index) => (
              <div 
                key={image.id}
                className={`result-thumbnail ${index === activeThumbnailIndex ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(image, index)}
                role="button"
                tabIndex={image.status === 'completed' ? 0 : -1}
                aria-label={`Select generated image ${index + 1}`}
                aria-busy={image.status === 'generating'}
              >
                {image.status === 'completed' && image.src ? (
                    <>
                        <img src={image.src} alt={`Generated image ${index + 1}`} />
                        <div className="style-tag" data-style-id={image.styleId}>
                            {image.style}
                        </div>
                    </>
                ) : (
                    <ThumbnailSpinner />
                )}
              </div>
            ))}
          </div>
        </aside>

      </main>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);