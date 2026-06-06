import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/FcBarcelona.css';

const lastUclWinDate = new Date(2015, 5, 6);

function getTimeSince(startDate) {
    const now = new Date();
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();
    let hours = now.getHours() - startDate.getHours();
    let minutes = now.getMinutes() - startDate.getMinutes();
    let seconds = now.getSeconds() - startDate.getSeconds();

    if (seconds < 0) {
        seconds += 60;
        minutes -= 1;
    }

    if (minutes < 0) {
        minutes += 60;
        hours -= 1;
    }

    if (hours < 0) {
        hours += 24;
        days -= 1;
    }

    if (days < 0) {
        const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += previousMonth.getDate();
        months -= 1;
    }

    if (months < 0) {
        months += 12;
        years -= 1;
    }

    return { years, months, days, hours, minutes, seconds };
}

function FcBarcelona() {
    const [timeSinceWin, setTimeSinceWin] = useState(() => getTimeSince(lastUclWinDate));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeSinceWin(getTimeSince(lastUclWinDate));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const timerBlocks = [
        { label: 'Years', value: timeSinceWin.years },
        { label: 'Months', value: timeSinceWin.months },
        { label: 'Days', value: timeSinceWin.days },
        { label: 'Hours', value: timeSinceWin.hours },
        { label: 'Minutes', value: timeSinceWin.minutes },
        { label: 'Seconds', value: timeSinceWin.seconds }
    ];

    return (
        <div className="barca-page">
            <nav className="barca-navbar">
                <div className="logo">Orion</div>
                <Link to="/" className="barca-home">Home</Link>
            </nav>

            <main className="barca-content">
                <section className="barca-hero">
                    <div className="barca-copy">
                        <span className="barca-kicker">FC Barcelona</span>
                        <h1>Time Since The Last UCL Win</h1>
                        <p>Barcelona last won the UEFA Champions League on June 6, 2015, beating Juventus 3-1 in Berlin.</p>
                    </div>
                </section>

                <section className="barca-timer" aria-label="Time since FC Barcelona last won the Champions League">
                    {timerBlocks.map((block) => (
                        <div className="barca-time-card" key={block.label}>
                            <strong>{String(block.value).padStart(2, '0')}</strong>
                            <span>{block.label}</span>
                        </div>
                    ))}
                </section>

                <section className="barca-note">
                    <h2>2015 Final</h2>
                    <p>
                        The count starts from June 6, 2015, the date of Barcelona's most recent
                        Champions League trophy.
                    </p>
                </section>
            </main>
        </div>
    );
}

export default FcBarcelona;
