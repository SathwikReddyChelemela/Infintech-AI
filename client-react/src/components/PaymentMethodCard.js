import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardActions, Typography, TextField, Grid, Button, Box, Alert } from '@mui/material';
import axios from 'axios';

// Simple Luhn check for client-side validation (do not send full PAN to server)
function luhnCheck(num) {
  const arr = (num + '')
    .split('')
    .reverse()
    .map(x => parseInt(x, 10));
  const lastDigit = arr.shift();
  let sum = arr.reduce((acc, val, idx) => (idx % 2 === 0 ? acc + ((val *= 2) > 9 ? val - 9 : val) : acc + val), 0);
  sum += lastDigit;
  return sum % 10 === 0;
}

// No brand detection; we only keep masked metadata.

export default function PaymentMethodCard() {
  const [existing, setExisting] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [name, setName] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await axios.get('/customer/payment-method');
        if (!ignore) {
          const pm = res.data?.paymentMethod || null;
          setExisting(pm);
          if (pm) {
            setName(pm.name || '');
            setExpMonth(pm.expMonth ? String(pm.expMonth) : '');
            setExpYear(pm.expYear ? String(pm.expYear) : '');
          }
        }
      } catch (e) {
        // ignore fetch errors in UI
      }
    })();
    return () => { ignore = true; };
  }, []);

  const last4 = useMemo(() => (cardNumber.replace(/\D/g, '').slice(-4) || ''), [cardNumber]);

  const onSave = async () => {
    setError('');
    setSuccess('');

    const digits = cardNumber.replace(/\D/g, '');
    if (digits && (!luhnCheck(digits) || digits.length < 13)) {
      setError('Please enter a valid card number.');
      return;
    }
    const monthNum = parseInt(expMonth, 10);
    const yearNum = parseInt(expYear, 10);
    if (!monthNum || monthNum < 1 || monthNum > 12) {
      setError('Expiration month must be 1-12.');
      return;
    }
    if (!yearNum || yearNum < new Date().getFullYear()) {
      setError('Expiration year must be this year or later.');
      return;
    }
    if (!name.trim()) {
      setError('Name on card is required.');
      return;
    }

    setSaving(true);
    try {
  const payload = { last4, expMonth: monthNum, expYear: yearNum, name: name.trim() };
      const res = await axios.put('/customer/payment-method', payload);
      setExisting(res.data?.paymentMethod || payload);
      setSuccess('Payment method saved.');
      setCardNumber(''); // do not retain full PAN
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Billing & Payment
        </Typography>
    {existing ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
      Saved card: •••• {existing.last4} (exp {existing.expMonth}/{existing.expYear})
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No card on file. Add one below.
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Card number"
              fullWidth
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              inputProps={{ inputMode: 'numeric' }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Name on card"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Exp. month"
              fullWidth
              placeholder="MM"
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value)}
              inputProps={{ inputMode: 'numeric', maxLength: 2 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Exp. year"
              fullWidth
              placeholder="YYYY"
              value={expYear}
              onChange={(e) => setExpYear(e.target.value)}
              inputProps={{ inputMode: 'numeric', maxLength: 4 }}
            />
          </Grid>
          {/* No brand field */}
        </Grid>
      </CardContent>
      <CardActions>
        <Button variant="contained" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Card'}
        </Button>
      </CardActions>
    </Card>
  );
}
