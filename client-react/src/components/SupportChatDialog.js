import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  Divider,
  CircularProgress
} from '@mui/material';
import { Close, Send } from '@mui/icons-material';
import axios from 'axios';

function SupportChatDialog({ open, onClose, user }) {
  const [messages, setMessages] = useState([
    { id: 'sys-1', from: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { id: `u-${Date.now()}`, from: 'you', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const res = await axios.post('/support/chat', { message: text });
      const answer = res.data?.answer || 'Sorry, I could not process that.';
      const botMsg = { id: `b-${Date.now()}`, from: 'bot', text: answer };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      const botMsg = { id: `b-${Date.now()}`, from: 'bot', text: 'There was an error contacting support. Please try again.' };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setSending(false);
      // Scroll to bottom
      setTimeout(() => {
        try {
          if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
          }
        } catch {}
      }, 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    if (!sending) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Support</Typography>
          <IconButton onClick={handleClose} disabled={sending}><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box ref={listRef} sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
          <List>
            {messages.map((m) => (
              <ListItem key={m.id} alignItems="flex-start" sx={{
                justifyContent: m.from === 'you' ? 'flex-end' : 'flex-start'
              }}>
                <Box sx={{
                  maxWidth: '80%',
                  bgcolor: m.from === 'you' ? 'primary.main' : 'grey.100',
                  color: m.from === 'you' ? 'primary.contrastText' : 'text.primary',
                  px: 1.5,
                  py: 1,
                  borderRadius: 2
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ alignItems: 'center', p: 2, pt: 1 }}>
        <TextField
          fullWidth
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
        />
        <IconButton color="primary" onClick={sendMessage} disabled={sending || !input.trim()} sx={{ ml: 1 }}>
          {sending ? <CircularProgress size={20} /> : <Send />}
        </IconButton>
      </DialogActions>
    </Dialog>
  );
}

export default SupportChatDialog;
