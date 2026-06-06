import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Progress.css';

const SECOND = 1000;
const DAY = 24 * 60 * 60 * SECOND;
const YEAR = 365.2425 * DAY;

function formatNumber(value) {
    return Math.floor(value).toLocaleString('en-US');
}

function formatShortDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
    });
}

function getValidBirthDate(day, month, year) {
    const dayNumber = Number(day);
    const monthNumber = Number(month);
    const yearNumber = Number(year);

    if (!day || !month || !year) {
        return null;
    }

    const date = new Date(yearNumber, monthNumber - 1, dayNumber);
    const today = new Date();

    if (
        date.getFullYear() !== yearNumber ||
        date.getMonth() !== monthNumber - 1 ||
        date.getDate() !== dayNumber ||
        date > today ||
        yearNumber < 1900
    ) {
        return null;
    }

    return date;
}

function Progress() {
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [birthDate, setBirthDate] = useState(null);
    const [now, setNow] = useState(new Date());
    const [error, setError] = useState('');

    const life = useMemo(() => {
        if (!birthDate) {
            return null;
        }

        const elapsed = Math.max(now - birthDate, 0);
        const seconds = elapsed / SECOND;
        const days = elapsed / DAY;
        const heartbeats = seconds * 1.2;
        const breaths = seconds / 4;
        const bloodLiters = heartbeats * 0.000077;
        const sunDistance = seconds * 29.78;
        const moonLoops = days / 27.3;
        const weekday = birthDate.toLocaleDateString('en-US', { weekday: 'long' });

        return {
            days,
            weekday,
            heartbeats,
            breaths,
            bloodLiters,
            sunDistance,
            moonLoops,
            earthOrbits: elapsed / YEAR,
            birthLabel: formatShortDate(birthDate)
        };
    }, [birthDate, now]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const date = getValidBirthDate(day, month, year);

        if (!date) {
            setBirthDate(null);
            setError('Please enter a real past date after 1900.');
            return;
        }

        setError('');
        setNow(new Date());
        setBirthDate(date);
    };

    return (
        <div className="progress-page">
            <nav className="progress-navbar">
                <div className="logo">Orion</div>
                <Link to="/" className="progress-home">Home</Link>
            </nav>

            <main className="progress-content">
                <section className="progress-hero">
                    <span className="progress-kicker">Life Progress</span>
                    <h1>How long have you been doing this whole existence thing?</h1>
                    <p>Enter your birth date and watch the universe turn your age into strange little numbers.</p>
                </section>

                <form className="age-form" onSubmit={handleSubmit}>
                    <label>
                        Date
                        <input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="DD"
                            value={day}
                            onChange={(event) => setDay(event.target.value)}
                        />
                    </label>
                    <label>
                        Month
                        <input
                            type="number"
                            min="1"
                            max="12"
                            placeholder="MM"
                            value={month}
                            onChange={(event) => setMonth(event.target.value)}
                        />
                    </label>
                    <label>
                        Year
                        <input
                            type="number"
                            min="1900"
                            placeholder="YYYY"
                            value={year}
                            onChange={(event) => setYear(event.target.value)}
                        />
                    </label>
                    <button type="submit">Let's Go</button>
                </form>

                {error && <p className="progress-error">{error}</p>}

                {life && (
                    <section className="progress-story" aria-label="Life progress story">
                        <div className="calendar-scene">
                            <div className="birth-calendar">
                                <div className="calendar-weekday">{life.weekday}</div>
                                <div className="calendar-day">{birthDate.getDate()}</div>
                                <div className="calendar-month">{life.birthLabel}</div>
                            </div>

                            <p>A lot has happened in the {formatNumber(life.days)} days since you were born.</p>
                        </div>

                        <div className="story-line muted">Since you were born...</div>

                        <section className="story-panel">
                            <p>Your heart has beaten about <strong>{formatNumber(life.heartbeats)}</strong> times and pumped <strong>{formatNumber(life.bloodLiters)}</strong> L of blood.</p>
                        </section>

                        <section className="story-panel">
                            <p>You have taken roughly <strong>{formatNumber(life.breaths)}</strong> breaths. That is a lot of tiny air meetings.</p>
                        </section>

                        <section className="space-panel">
                            <div className="orbit-art" aria-hidden="true">
                                <div className="orbit-ring"></div>
                                <div className="orbit-sun"></div>
                                <div className="orbit-earth"></div>
                            </div>
                        </section>

                        <section className="story-panel centered">
                            <p>You have traveled <strong>{formatNumber(life.sunDistance)}</strong> km around the Sun.</p>
                        </section>

                        <section className="story-panel muted">
                            <p>Earth has rotated <strong>{formatNumber(life.days)}</strong> times and completed <strong>{life.earthOrbits.toFixed(2)}</strong> trips around the Sun.</p>
                        </section>

                        <section className="story-panel">
                            <p>The Moon has looped around Earth about <strong>{formatNumber(life.moonLoops)}</strong> times since your first day here.</p>
                        </section>
                    </section>
                )}
            </main>
        </div>
    );
}

export default Progress;
