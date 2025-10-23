const { useState, useEffect } = React;

function App() {
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);

  // Données
  const accounts = {
    GEL: [
      { bank: 'Bank of Georgia', name: 'Universal Account', balance: 655.54 },
      { bank: 'Bank of Georgia', name: 'Rainy days', balance: 15000, interest: 1599.25, rate: 10.75 },
      { bank: 'Bank of Georgia', name: 'Revenues 2025', balance: 69000, interest: 4658.70, rate: 10.75 },
    ],
    AED: [
      { bank: 'Wio Bank', name: 'Livret classique', balance: 573746.36, rate: 3.25 },
      { bank: 'Wio Bank', name: 'Fixed Saving Space', balance: 1000000, rate: 6.0 },
      { bank: 'HSBC', name: 'MT PERSO', balance: 197.21 },
      { bank: 'ADCB', name: 'Current Account', balance: 112.22 },
    ],
    EUR: [
      { bank: 'Wise', name: 'Compte principal', balance: 18767.76 },
      { bank: 'Crédit Agricole', name: 'Parts sociales', balance: 23000 },
    ],
  };

  const realEstate = [
    { name: 'La Garenne-Colombes', value: 500000, revenue: 20000 },
    { name: 'Quiberon', value: 500000, revenue: 10000 },
    { name: 'Gudauri', value: 210000, revenue: 25000 },
  ];

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/EUR')
      .then(res => res.json())
      .then(data => {
        setRates(data.rates);
        setLoading(false);
      })
      .catch(() => {
        setRates({ EUR: 1, AED: 4.01, USD: 1.09, GEL: 2.98 });
        setLoading(false);
      });
  }, []);

  const convert = (amount, from) => {
    if (!rates[from]) return 0;
    if (baseCurrency === 'EUR') return amount / rates[from];
    return (amount / rates[from]) * rates.AED;
  };

  const calcLiquidities = () => {
    let total = 0;
    Object.entries(accounts).forEach(([curr, accs]) => {
      accs.forEach(a => total += convert(a.balance + (a.interest || 0), curr));
    });
    return total;
  };

  const calcRealEstate = () => realEstate.reduce((s, p) => s + convert(p.value, 'EUR'), 0);

  const fmt = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="container">
      <div className="header">
        <h1>Patrimoine Global</h1>
        <p>Référence PR2025 • Dashboard minimaliste</p>
      </div>

      <div className="controls">
        <button className={`btn ${baseCurrency === 'EUR' ? 'btn-active' : ''}`} onClick={() => setBaseCurrency('EUR')}>€ EUR</button>
        <button className={`btn ${baseCurrency === 'AED' ? 'btn-active' : ''}`} onClick={() => setBaseCurrency('AED')}>د.إ AED</button>
        <button className="btn" disabled={loading}>{loading ? 'Chargement...' : '⟳ Actualiser'}</button>
        <button className={`btn ${editMode ? 'btn-edit' : ''}`} onClick={() => setEditMode(!editMode)}>
          {editMode ? '✓ Mode édition' : '✏️ Modifier'}
        </button>
      </div>

      {editMode && (
        <div className="alert success">
          <h4>✏️ Mode édition activé</h4>
          <p>Pour modifier les données, contactez-moi avec la liste des corrections à appliquer.</p>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`} onClick={() => setActiveTab('overview')}>Vue d'ensemble</button>
        <button className={`tab ${activeTab === 'liquidities' ? 'tab-active' : ''}`} onClick={() => setActiveTab('liquidities')}>Liquidités</button>
        <button className={`tab ${activeTab === 'realestate' ? 'tab-active' : ''}`} onClick={() => setActiveTab('realestate')}>Immobilier</button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card primary">
          <div className="label">Patrimoine Net</div>
          <div className="value">{fmt(calcLiquidities() + calcRealEstate())} {baseCurrency}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Liquidités</div>
          <div className="value positive">{fmt(calcLiquidities())} {baseCurrency}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Immobilier</div>
          <div className="value">{fmt(calcRealEstate())} {baseCurrency}</div>
        </div>
      </div>

      {activeTab === 'liquidities' && (
        <>
          {Object.entries(accounts).map(([curr, accs]) => (
            <div key={curr} className="content-card">
              <h3>{curr === 'EUR' ? '€' : curr === 'AED' ? 'د.إ' : '₾'} {curr}</h3>
              {accs.map((a, i) => (
                <div key={i} className="account-item">
                  <div className="info">
                    <h4>{a.name}</h4>
                    <p>{a.bank}</p>
                    {a.rate && <p className="gain-positive">Taux: {a.rate}%</p>}
                  </div>
                  <div className="amount">
                    <div className="main">{fmt(a.balance)} {curr}</div>
                    {a.interest && <div className="secondary gain-positive">+{fmt(a.interest)}</div>}
                    <div className="secondary">≈ {fmt(convert(a.balance + (a.interest || 0), curr))} {baseCurrency}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {activeTab === 'realestate' && (
        <div className="content-card">
          <h3>Patrimoine Immobilier</h3>
          {realEstate.map((p, i) => (
            <div key={i} className="account-item">
              <div className="info">
                <h4>{p.name}</h4>
                <p className="gain-positive">Revenus: {fmt(p.revenue)} €/an</p>
              </div>
              <div className="amount">
                <div className="main">{fmt(p.value)} €</div>
                <div className="secondary">≈ {fmt(convert(p.value, 'EUR'))} {baseCurrency}</div>
              </div>
            </div>
          ))}
          <div className="summary-card">
            <div className="summary-grid">
              <div className="summary-item">
                <div className="label">Valeur totale</div>
                <div className="value">{fmt(realEstate.reduce((s, p) => s + p.value, 0))} €</div>
              </div>
              <div className="summary-item">
                <div className="label">Revenus annuels</div>
                <div className="value">{fmt(realEstate.reduce((s, p) => s + p.revenue, 0))} €</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="footer">
        Taux de change mis à jour en temps réel • Dashboard privé
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
