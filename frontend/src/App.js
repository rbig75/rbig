import React, { useState } from 'react';
import { Container, Typography, Box, Button, CircularProgress, TextField, Select, MenuItem } from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function App() {
  const [file, setFile] = useState(null);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('');
  const [subtitles, setSubtitles] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);

    try {
      const response = await axios.post(`${API_URL}/transcribe/`, formData);
      setTaskId(response.data.task_id);
      setStatus(response.data.status);
      checkTaskStatus(response.data.task_id);
    } catch (error) {
      console.error('Error submitting file:', error);
    }
  };

  const checkTaskStatus = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/task/${id}`);
      setStatus(response.data.status);
      if (response.data.status === 'COMPLETED') {
        setSubtitles(response.data.result);
      } else if (response.data.status !== 'FAILED') {
        setTimeout(() => checkTaskStatus(id), 5000);
      }
    } catch (error) {
      console.error('Error checking task status:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([subtitles], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Video Transcription App
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            type="file"
            onChange={handleFileChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <Select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem value="auto">Auto Detect</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
          </Select>
          <Select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
          </Select>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Transcribe
          </Button>
        </form>
        {status && (
          <Box sx={{ mt: 2 }}>
            <Typography>Status: {status}</Typography>
            {status === 'PROCESSING' && <CircularProgress />}
          </Box>
        )}
        {subtitles && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Subtitles:</Typography>
            <TextField
              multiline
              rows={10}
              value={subtitles}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
            <Button onClick={handleDownload} variant="contained" color="secondary" sx={{ mt: 2 }}>
              Download Subtitles
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default App;