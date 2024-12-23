import React, { useState } from 'react';
import ReactMde from 'react-mde';
import ReactMarkdown from 'react-markdown';
import 'react-mde/lib/styles/css/react-mde-all.css';
import { Box } from '@mui/material';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, label }) => {
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");

  // Customize toolbar to remove unwanted options
  const toolbarCommands = [
    ["header", "bold", "italic", "strikethrough"],
    ["unordered-list", "ordered-list"],
  ];

  return (
    <Box
      sx={{
        '& .mde-header': {
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderBottom: 'none',
        },
        '& .mde-header .mde-tabs button': {
          padding: '0.5rem 1rem',
          color: '#666',
          '&.selected': {
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderBottom: 'none',
            marginBottom: '-1px',
          },
        },
        '& .mde-text': {
          backgroundColor: '#fff',
          color: '#000',
          border: '1px solid #ddd',
          padding: '0.5rem',
          minHeight: '200px',
        },
        '& .mde-preview': {
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          padding: '0.5rem',
          minHeight: '200px',
        },
      }}
    >
      {label && (
        <Box sx={{ mb: 1 }}>
          <label style={{ fontWeight: 'bold' }}>{label}</label>
        </Box>
      )}
      <ReactMde
        value={value}
        onChange={onChange}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        toolbarCommands={toolbarCommands} // Use customized toolbar
        generateMarkdownPreview={(markdown) =>
          Promise.resolve(
            <div className="mde-preview">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          )
        }
        minEditorHeight={200}
        heightUnits="px"
      />
    </Box>
  );
};

export default MarkdownEditor;
