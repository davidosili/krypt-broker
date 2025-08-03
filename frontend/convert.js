const API_URL = location.hostname.includes('localhost') || location.hostname.includes('127.')
  ? 'http://localhost:3000/api'
  : 'https://krypt-broker.onrender.com/api';

const urlParams = new URLSearchParams(window.location.search);
const symbol = urlParams.get('symbol');
let coinBalance = 0;
let coinPrice = 1;

document.getElementById('coinTitle').textContent = `Loading ${symbol}...`;

async function loadData() {
  try {
    // 1. Load user portfolio
    const res = await fetch(`${API_URL}/trade/portfolio`, { credentials: 'include' });
    const data = await res.json();
    const holdings = data.portfolio || data.holdings || {};
    coinBalance = holdings[symbol] || 0;
    document.getElementById('coinBalance').textContent = `${coinBalance} ${symbol}`;

    // 2. Load market prices
    const markets = await fetch(`${API_URL}/coin/markets`).then(res => res.json());
    const current = markets.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    coinPrice = current.current_price;
    document.getElementById('usdValue').textContent = `≈ $${(coinBalance * coinPrice).toFixed(2)}`;

    // 3. Populate conversion dropdown
    const select = document.getElementById('targetCoin');
    markets.forEach(c => {
      if (c.symbol.toUpperCase() !== symbol.toUpperCase()) {
        const opt = document.createElement('option');
        opt.value = c.symbol.toUpperCase();
        opt.textContent = `${c.name} (${c.symbol.toUpperCase()})`;
        select.appendChild(opt);
      }
    });

    document.getElementById('coinTitle').textContent = `${symbol} Actions`;
  } catch (err) {
    alert('Failed to load coin info.');
    console.error(err);
  }
}

async function handleConvert() {
  const target = document.getElementById('targetCoin').value;
  const amount = parseFloat(document.getElementById('convertAmount').value);

  if (!target || !amount || amount <= 0 || amount > coinBalance) {
    return alert("❌ Invalid conversion amount.");
  }

  const res = await fetch(`${API_URL}/trade/convert`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: symbol, to: target, amount })
  });

  const result = await res.json();
  if (res.ok) {
    alert(`✅ Converted ${amount} ${symbol} to ${target}.`);
    location.reload();
  } else {
    alert(`❌ ${result.error || 'Conversion failed'}`);
  }
}

async function handleTransfer() {
  const to = document.getElementById('recipient').value.trim();
  const amount = parseFloat(document.getElementById('transferAmount').value);

  if (!to || !amount || amount <= 0 || amount > coinBalance) {
    return alert("❌ Invalid transfer.");
  }

  const res = await fetch(`${API_URL}/trade/transfer`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, amount, to })
  });

  const result = await res.json();
  if (res.ok) {
    alert(`✅ Transferred ${amount} ${symbol} to ${to}`);
    location.reload();
  } else {
    alert(`❌ ${result.error || 'Transfer failed'}`);
  }
}

loadData();
