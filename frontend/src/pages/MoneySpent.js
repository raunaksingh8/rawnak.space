import { useState } from 'react';
import '../styles/Moneyspent.css';

const ENTRIES = [
  { id: 'teacher-india', label: 'Teacher', rate: 300 },
  { id: 'software-engineer-india', label: 'Software Engineer', rate: 600 },
  { id: 'doctor-india', label: 'Doctor', rate: 1000 },
  { id: 'virat-kohli', label: 'Virat Kohli', rate: 250000 },
  { id: 'shah-rukh-khan', label: 'Shah Rukh Khan', rate: 300000 },
  { id: 'lionel-messi', label: 'Lionel Messi', rate: 1300000 },
  { id: 'gautam-adani', label: 'Gautam Adani', rate: 40000000 },
  { id: 'mukesh-ambani', label: 'Mukesh Ambani', rate: 80000000 },
  { id: 'india-military-expenditure', label: 'India Military Expenditure', rate: 890000000 },
  { id: 'custom', label: 'Your Income', rate: null, custom: true },
];

const BILL_VALUE = 500;
const PX_PER_CM = 96 / 2.54;
const BILL_VISIBLE_W = 180;
const BILL_GAP_CM = 0.2;
const SPEED_CM_PER_100_RUPEES = 0.1;
const RATE_PER_LANE = 3000;
const MAX_LANES = 3;
const OVERFLOW_SPEED_BOOST = 2.4;
const MIN_VISIBLE_SPEED = 70;
const STREAM_DISTANCE = 4200;
const MONEY_IMAGE = '/images/moneyspent.png';
const RUPEE = '\u20B9';

function getStreamSpeed(rate) {
  return (Math.max(0, rate) / 100) * SPEED_CM_PER_100_RUPEES * PX_PER_CM;
}

function getLaneCount(rate) {
  if (rate <= RATE_PER_LANE) return 1;
  return Math.min(MAX_LANES, Math.ceil(rate / RATE_PER_LANE));
}

function getLaneRate(rate) {
  if (rate <= RATE_PER_LANE) return rate;

  const laneCount = getLaneCount(rate);
  const perLaneRate = rate / laneCount;

  if (perLaneRate <= RATE_PER_LANE) return perLaneRate;

  const fullLaneCapacity = RATE_PER_LANE * MAX_LANES;
  const overflowRatio = Math.max(1, rate / fullLaneCapacity);
  return RATE_PER_LANE * (1 + Math.log10(overflowRatio) * OVERFLOW_SPEED_BOOST);
}

function getAnimationDuration(rate, distance = STREAM_DISTANCE) {
  const speed = Math.max(MIN_VISIBLE_SPEED, getStreamSpeed(getLaneRate(rate)));
  return Math.max(1.8, distance / speed);
}

function formatMoney(n) {
  if (n >= 1e7) return RUPEE + (n / 1e7).toFixed(2) + 'Cr';
  if (n >= 1e5) return RUPEE + (n / 1e5).toFixed(2) + 'L';
  if (n >= 1e3) return RUPEE + (n / 1e3).toFixed(1) + 'K';
  return RUPEE + n.toFixed(2);
}

function formatRate(r) {
  if (!r && r !== 0) return '';
  if (r >= 1e3) return formatMoney(r) + '/hr';
  return RUPEE + r.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '/hr';
}

function MoneyStream({ rate }) {
  const laneCount = getLaneCount(rate);
  const spacing = BILL_VISIBLE_W + BILL_GAP_CM * PX_PER_CM;
  const billCount = Math.ceil(STREAM_DISTANCE / spacing) + 6;
  const cycleWidth = billCount * spacing;
  const duration = getAnimationDuration(rate, cycleWidth);

  return (
    <div className="pm-row-stream" style={{ '--lane-count': laneCount }}>
      {Array.from({ length: laneCount }).map((_, laneIndex) => (
        <div
          className="pm-stream-lane"
          key={laneIndex}
          style={{ '--cycle-width': `${cycleWidth}px` }}
        >
          <div className="pm-marquee-track" style={{ animationDuration: `${duration}s` }}>
            {[0, 1].map(stripIndex => (
              <div
                className="pm-note-strip"
                key={stripIndex}
                style={{ left: `${stripIndex * cycleWidth}px` }}
              >
                {Array.from({ length: billCount }).map((__, billIndex) => (
                  <div
                    className="pm-bill"
                    key={billIndex}
                    style={{ left: `${billIndex * spacing}px` }}
                  >
                    <img src={MONEY_IMAGE} alt="500 rupees bundle" draggable="false" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MoneyRow({ entry, customRate, onCustomRateChange }) {
  const rate = entry.custom ? customRate : entry.rate;

  return (
    <section className="pm-money-row">
      <div className="pm-row-info">
        <div className="pm-row-name">{entry.label}</div>
        {entry.custom ? (
          <div className="pm-custom-row">
            <label>{RUPEE}</label>
            <input
              type="number"
              value={customRate}
              min="0"
              max="1000000000"
              step="1"
              onChange={(e) => onCustomRateChange(parseFloat(e.target.value) || 0)}
            />
            <span className="pm-btn-rate">/hr</span>
          </div>
        ) : (
          <div className="pm-row-rate">{formatRate(rate)}</div>
        )}
      </div>
      <MoneyStream rate={rate} />
    </section>
  );
}

function MoneySpent() {
  const [customRate, setCustomRate] = useState(300);

  return (
    <div className="pm-root">
      <header className="pm-title-block">
        <h1>Money Spent</h1>
        <div className="pm-made-by">Made by Raunak Singh</div>
      </header>

      <main className="pm-list">
        {ENTRIES.map(entry => (
          <MoneyRow
            key={entry.id}
            entry={entry}
            customRate={customRate}
            onCustomRateChange={setCustomRate}
          />
        ))}
      </main>

      <div className="pm-legend">
        <img src={MONEY_IMAGE} alt="500 rupees bundle" />
        <span className="pm-legend-eq">=</span>
        <span>{formatMoney(BILL_VALUE)}</span>
      </div>
    </div>
  );
}

export default MoneySpent;
