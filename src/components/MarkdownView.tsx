import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Box } from '@mui/material';

interface MarkdownViewerProps {
  content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    <Box
      sx={{
        textAlign: 'left', // Align text to the left
        '& h1': {
          fontSize: '2.5em',
          fontWeight: 'bold',
          my: 2,
          borderBottom: '2px solid #ddd',
          paddingBottom: '0.5rem',
        },
        '& h2': {
          fontSize: '2em',
          fontWeight: 'bold',
          my: 2,
          borderBottom: '1px solid #ddd',
          paddingBottom: '0.3rem',
        },
        '& h3': {
          fontSize: '1.75em',
          fontWeight: 'bold',
          my: 2,
        },
        '& h4': {
          fontSize: '1.5em',
          fontWeight: '600',
          my: 2,
        },
        '& h5': {
          fontSize: '1.25em',
          fontWeight: '600',
          my: 2,
        },
        '& h6': {
          fontSize: '1em',
          fontWeight: '600',
          my: 2,
          color: '#555',
        },
        '& hr': {
          border: 'none',
          borderTop: '2px solid #ccc',
          margin: '1rem 0',
        },
        '& p': { my: 1 },
        '& ul, & ol': { pl: 4, my: 1 },
        '& li': { my: 0.5 },
      }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </Box>
  );
};

export default MarkdownViewer;
