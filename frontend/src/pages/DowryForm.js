import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/DowryCal.css';

export default function DowryForm() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [religion, setReligion] = useState('');
  const [salary, setSalary] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [profession, setProfession] = useState('');
const [education, setEducation] = useState('');

  const ANNUAL = 18787.9;
  const perSec = ANNUAL / (365 * 24 * 3600);
  const perMin = (ANNUAL / (365 * 24 * 60)).toFixed(3);
  const perHour = (ANNUAL / (365 * 24)).toFixed(2);
  const perDay = (ANNUAL / 365).toFixed(1);
  const cycleSeconds = 1 / perSec;

  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const countElRef = useRef(null);
  const elapsedElRef = useRef(null);
  const fillElRef = useRef(null);

  function pad(n) {
    return String(Math.floor(n)).padStart(2, '0');
  }

  useEffect(() => {
    function tick(ts) {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = (ts - startTimeRef.current) / 1000;
      const deaths = elapsed * perSec;

      if (countElRef.current) countElRef.current.textContent = deaths.toFixed(3);

      const mins = Math.floor(elapsed / 60);
      const secs = Math.floor(elapsed % 60);
      if (elapsedElRef.current)
        elapsedElRef.current.textContent = pad(mins) + ':' + pad(secs);

      const cyclePos = (elapsed % cycleSeconds) / cycleSeconds;
      if (fillElRef.current)
        fillElRef.current.style.width = (cyclePos * 100).toFixed(1) + '%';

      if (countElRef.current)
        countElRef.current.style.color = cyclePos > 0.95 ? '#e74c3c' : '#c0392b';

      animFrameRef.current = requestAnimationFrame(tick);
    }

    if (submitted) {
      startTimeRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [submitted, perSec, cycleSeconds]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setDisplayName(name.trim().split(' ')[0]);
    setSubmitted(true);
  }

  return (
    <div className="dc-page">
      <nav className="dc-nav">
        <Link to="/" className="dc-home-btn" aria-label="Home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </nav>

      <main className="dc-main">

        {/* ── FORM ── */}
        {!submitted && (
  <div className="dc-card" role="region" aria-labelledby="form-title">
    <div className="dc-card-header">
      <h1 id="form-title">Dowry calculator</h1>
      <p>Enter to calculate your dowry.</p>
    </div>
    <form className="dc-form-body" onSubmit={handleSubmit}>

      <div className="dc-field">
        <label htmlFor="dc-name">Your name</label>
        <input
          id="dc-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>

      <div className="dc-field-row">
        <div className="dc-field">
          <label htmlFor="dc-age">Age</label>
          <input
            id="dc-age"
            type="number"
            min="1"
            max="120"
            value={age}
            onChange={e => setAge(e.target.value)}
            required
          />
        </div>
        <div className="dc-field">
          <label htmlFor="dc-religion">Religion</label>
          <select id="dc-religion" value={religion} onChange={e => setReligion(e.target.value)}>
            <option value="">Select</option>
            <option>Hindu</option>
            <option>Muslim</option>
            <option>Christian</option>
            <option>Sikh</option>
            <option>Buddhist</option>
            <option>Jain</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div className="dc-field-row">
        <div className="dc-field">
          <label htmlFor="dc-profession">Profession</label>
          <select id="dc-profession" value={profession} onChange={e => setProfession(e.target.value)} required>
            <option value="">Select</option>
            <option>Entrepreneur</option>
            <option>Engineer</option>
            <option>Doctor</option>
            <option>Investment Banker</option>
            <option>Brand Manager</option>
            <option>Product Manager</option>
            <option>Content Creator</option>
            <option>Others</option>
          </select>
        </div>
        <div className="dc-field">
          <label htmlFor="dc-education">Education</label>
          <select id="dc-education" value={education} onChange={e => setEducation(e.target.value)} required>
            <option value="">Select</option>
            <option>High School</option>
            <option>Graduation</option>
            <option>Post Graduation</option>
            <option>PhD</option>
            <option>Dropout</option>
          </select>
        </div>
      </div>

      <div className="dc-field">
        <label htmlFor="dc-salary">Monthly income</label>
        <select id="dc-salary" value={salary} onChange={e => setSalary(e.target.value)}>
             <option value="">Select</option>
          <option>Below ₹50,000</option>
          <option>₹50,000 - ₹1,00,000</option>
          <option>Above ₹1,00,000</option>
        </select>
      </div>

      <button type="submit" className="dc-submit-btn">Calculate</button>
    </form>
  </div>
)}

        {/* ── RESULT ── */}
        {submitted && (
          <div className="dc-card" role="region" aria-label="Dowry awareness counter">
            <div className="dc-result-header">
              <div className="dc-eyebrow">Awareness counter</div>
              <h2>
                While you read this,{' '}
                <span className="dc-name">{displayName}</span>,
                women are losing their lives to dowry.
              </h2>
              <p>
                Based on reported dowry deaths in India each year - 
                <strong> 1 woman dies every 28 minutes</strong>. The real number is believed to be <strong>
                 far higher </strong> .
              </p>
            </div>

            <div className="dc-counter-section">
              <div className="dc-counter-label">Deaths since you opened this page</div>
              <div className="dc-counter-digits" ref={countElRef} aria-live="polite">0.000</div>
              <div className="dc-counter-sublabel">reported dowry deaths</div>
              <div className="dc-pulse-bar">
                <div className="dc-pulse-fill" ref={fillElRef} />
              </div>
            </div>

            <div className="dc-stats-section">
              <div className="dc-stats-title">Rate of reported dowry deaths</div>
              <div className="dc-stats-grid">
                <div className="dc-stat-card">
                  <div className="dc-s-val">{perMin}</div>
                  <div className="dc-s-lbl">per minute</div>
                </div>
                <div className="dc-stat-card">
                  <div className="dc-s-val">{perHour}</div>
                  <div className="dc-s-lbl">per hour</div>
                </div>
                <div className="dc-stat-card">
                  <div className="dc-s-val">{perDay}</div>
                  <div className="dc-s-lbl">per day</div>
                </div>
              </div>
            </div>

            <div className="dc-elapsed-section">
              <span className="dc-elapsed-lbl">You've been on this page for</span>
              <span className="dc-elapsed-val" ref={elapsedElRef}>00:00</span>
            </div>

            <div className="dc-actions-row">
              <span className="dc-source">Source: NCRB India</span>
            </div>

            <div className="dc-footnote">
              Every life behind these numbers was someone's daughter, sister, or wife.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
