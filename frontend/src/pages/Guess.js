import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Guess.css";

const API_URL =
    process.env.REACT_APP_API_URL || "http://localhost:3001";

// const IMAGE_MAP = {
//     "Blue whale": "/images/blue-whale.png",
//     "Sewing needle": "/images/sewing-needle.jpg",
//     "Eiffel Tower": "/images/eiffel-tower.jpg",
//     "Adult cat": "/images/adult-cat.jpg",
//     "Olympic swimming pool": "/images/olympic-pool.jpg",
//     "Giraffe": "/images/giraffe.jpg",
//     "A grain of rice": "/images/rice-grain.jpg",
//     "School bus": "/images/school-bus.jpg",
// };

const UNITS = {
    in: {
        label: "in",
        toBase: 39.3701,
        decimals: 0,
    },
    ft: {
        label: "ft",
        toBase: 3.28084,
        decimals: 1,
    },
    m: {
        label: "m",
        toBase: 1,
        decimals: 2,
    },
};

function shuffleArray(length) {
    const arr = [...Array(length).keys()];

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

function formatLength(valM, unitKey) {
    const unit = UNITS[unitKey];
    const value = valM * unit.toBase;

    return `${value.toFixed(unit.decimals)} ${unit.label}`;
}

function niceStep(maxVal) {
    const raw = maxVal / 10;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;

    if (norm < 1.5) return 1 * mag;
    if (norm < 3.5) return 2 * mag;
    if (norm < 7.5) return 5 * mag;

    return 10 * mag;
}

function buildTicks(maxValInUnit) {
    const step = niceStep(maxValInUnit);
    const minorStep = step / 5;

    const ticks = [];

    for (
        let value = 0;
        value <= maxValInUnit + 0.0000001;
        value += minorStep
    ) {
        const pct = (value / maxValInUnit) * 100;

        if (pct > 100.001) break;

        const isMajor =
            Math.abs(Math.round(value / step) - value / step) <
            0.000001;

        ticks.push({
            value,
            pct,
            isMajor,
        });
    }

    return ticks;
}

function triggerConfetti() {
    const colors = ["#ff5da2", "#ffd60a", "#4cc9f0", "#a8e823", "#fff"];
    const card = document.querySelector(".guess-game-container .card");
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 80; i++) {
        const particle = document.createElement("div");
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.floor(Math.random() * 10) + 6;
        const isCircle = Math.random() > 0.5;

        // Random angle outward from center
        const angle = (Math.PI * 2 * i) / 80 + (Math.random() - 0.5) * 0.5;
        const velocity = 100 + Math.random() * 250;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity + Math.random() * 100;
        const rotation = Math.floor(Math.random() * 720 - 360);
        const duration = 1.2 + Math.random() * 1;

        Object.assign(particle.style, {
            position: "fixed",
            left: `${centerX}px`,
            top: `${centerY}px`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            border: "2px solid #101010",
            borderRadius: isCircle ? "50%" : "2px",
            pointerEvents: "none",
            zIndex: "9999",
            transform: "translate(-50%, -50%) scale(1)",
            opacity: "1",
            transition: `transform ${duration}s cubic-bezier(.15,.8,.3,1), opacity ${duration}s ease-out`,
        });

        document.body.appendChild(particle);

        // Force reflow then apply end state
        void particle.offsetWidth;
        particle.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rotation}deg) scale(0.2)`;
        particle.style.opacity = "0";

        setTimeout(() => particle.remove(), duration * 1000 + 100);
    }
}

export default function GuessTheLength() {
    const [specimens, setSpecimens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [order, setOrder] = useState([]);
    const [roundIndex, setRoundIndex] = useState(0);

    const [unit, setUnit] = useState("m");

    const [sliderValue, setSliderValue] = useState(500);

    const [dragging, setDragging] = useState(false);

    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [totalOffPct, setTotalOffPct] = useState(0);

    const [scoreBump, setScoreBump] = useState(false);

    const [showModal, setShowModal] = useState(false);

    const [result, setResult] = useState(null);

    const [showFinalScore, setShowFinalScore] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        loadSpecimens();
    }, []);

    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const root = document.getElementById('root');

        html.style.overflow = 'hidden';
        html.style.height = '100%';
        body.style.overflow = 'hidden';
        body.style.height = '100%';
        if (root) {
            root.style.overflow = 'hidden';
            root.style.height = '100%';
        }

        return () => {
            html.style.overflow = '';
            html.style.height = '';
            body.style.overflow = '';
            body.style.height = '';
            if (root) {
                root.style.overflow = '';
                root.style.height = '';
            }
        };
    }, []);

    async function loadSpecimens() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/specimens`
            );

            if (!response.ok) {
                throw new Error("Failed to load specimens");
            }

            const rows = await response.json();

            if (!rows?.length) {
                throw new Error("No specimens found");
            }

            const normalized = rows.map((row) => ({
                id: row.id,
                name: row.name,
                category: row.category,
                lengthM: row.length_m,
                scaleMaxM: row.scale_max_m,
            }));

            setSpecimens(normalized);

            const shuffled = shuffleArray(normalized.length);

            setOrder(shuffled);
            setRoundIndex(0);
        } catch (err) {
            console.error(err);

            setError(
                "Could not load specimens. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    const current = useMemo(() => {
        if (!specimens.length || !order.length) return null;

        return specimens[order[roundIndex]];
    }, [specimens, order, roundIndex]);

    const currentScaleMaxInUnit = useMemo(() => {
        if (!current) return 1;

        return current.scaleMaxM * UNITS[unit].toBase;
    }, [current, unit]);

    const ticks = useMemo(() => {
        return buildTicks(currentScaleMaxInUnit);
    }, [currentScaleMaxInUnit]);

    const guessM = useMemo(() => {
        if (!current) return 0;

        const fraction = sliderValue / 1000;

        return fraction * current.scaleMaxM;
    }, [sliderValue, current]);

    const guessPct = useMemo(() => {
        if (!current) return 0;

        return (guessM / current.scaleMaxM) * 100;
    }, [guessM, current]);

    const avgMiss = useMemo(() => {
        if (!attempts) return "—";

        return `${(totalOffPct / attempts).toFixed(0)}%`;
    }, [attempts, totalOffPct]);

    if (loading) {
        return (
            <div className="guess-game-container">
                <div className="spinner"></div>
                <p className="loading-text">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="guess-game-container">
                <div className="app">
                    <div className="card loading-card">
                        <h2>{error}</h2>

                        <button
                            className="check-btn"
                            onClick={loadSpecimens}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!current) return null;

    // const imageSrc = IMAGE_MAP[current.name];

    const handleSliderChange = (e) => {
        setSliderValue(Number(e.target.value));
    };
    const checkGuess = () => {
        const actualM = current.lengthM;

        const diff = Math.abs(guessM - actualM);
        const offPct = (diff / actualM) * 100;

        const newAttempts = attempts + 1;
        const newTotalOff = totalOffPct + offPct;

        setAttempts(newAttempts);
        setTotalOffPct(newTotalOff);

        let newScore = score;

        if (offPct <= 10) {
            newScore += 1;
            setScore(newScore);
        }

        setScoreBump(false);

        setTimeout(() => {
            setScoreBump(true);

            setTimeout(() => {
                setScoreBump(false);
            }, 300);
        }, 10);

        let verdict = "";
        let verdictClass = "";
        let subText = "";

        if (offPct <= 5) {
            verdict = "Dead on";
            verdictClass = "hit";
            subText = "Within 5%. Trained eye right there.";
        } else if (offPct <= 15) {
            verdict = "Close call";
            verdictClass = "hit";
            subText = "Solid guess, not far off at all.";
        } else if (offPct <= 40) {
            verdict = "Not quite";
            verdictClass = "miss";
            subText = "Right neighborhood, wrong house.";
        } else {
            verdict = "Way off";
            verdictClass = "miss";
            subText = "That is a big gap. Onward.";
        }

        if (offPct < 0.5) {
            triggerConfetti();
        }

        const revealMax = Math.max(
            current.scaleMaxM,
            guessM * 1.05,
            actualM * 1.05
        );

        setResult({
            verdict,
            verdictClass,
            subText,
            actualM,
            offPct,
            revealMax,
            guessPct: (guessM / revealMax) * 100,
            actualPct: (actualM / revealMax) * 100,
        });

        setShowModal(true);
    };

    const nextRound = () => {
        setShowModal(false);

        let nextIndex = roundIndex + 1;

        if (nextIndex >= order.length) {
            // All specimens guessed — show final scorecard
            setShowFinalScore(true);
            return;
        }

        setRoundIndex(nextIndex);
        setSliderValue(500);
    };

    const restartGame = () => {
        setShowModal(false);
        setShowFinalScore(false);

        setScore(0);
        setAttempts(0);
        setTotalOffPct(0);
        setResult(null);

        setOrder(shuffleArray(specimens.length));
        setRoundIndex(0);
        setSliderValue(500);
    };

    const quitGame = () => {
        navigate("/");
    };

    const modalTicks = result
        ? buildTicks(result.revealMax * UNITS[unit].toBase)
        : [];

    return (
        <div className="guess-game-container">
            <nav className="hmt-navbar">
                <Link to="/" className="hmt-home-link" aria-label="Home">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </nav>
            <div className="app">
                <div className="title-row">
                    <span className="eyebrow">
                        No rulers allowed
                    </span>

                    <h1>
                        <span>Guess</span> the length
                    </h1>
                </div>

                <div className="card">
                    <span className="round-label">
                        Specimen {roundIndex + 1} / {specimens.length}
                    </span>

                    <p className="specimen-name">
                        {current.name}
                    </p>

                    <p className="specimen-subtitle">Use your Imagination Power</p>

                    {/* <div className="specimen-visual">
                        {imageSrc ? (
                            <img
                                src={imageSrc}
                                alt={current.name}
                                className="specimen-image"
                            />
                        ) : (
                            <div className="image-placeholder">
                                {current.name}
                            </div>
                        )}
                    </div> */}

                    <div className="unit-row">
                        {["in", "ft", "m"].map((u) => (
                            <button
                                key={u}
                                className={`unit-btn ${unit === u ? "active" : ""
                                    }`}
                                onClick={() => setUnit(u)}
                            >
                                {u === "in"
                                    ? "inch"
                                    : u === "ft"
                                        ? "foot"
                                        : "metre"}
                            </button>
                        ))}
                    </div>

                    <div className="scale-wrap">
                        <div className="scale-track">
                            <div className="scale-rail"></div>

                            <div className="ticks-layer">
                                {ticks.map((tick, index) => (
                                    <React.Fragment key={index}>
                                        <div
                                            className={`tick ${tick.isMajor
                                                ? "major"
                                                : "minor"
                                                }`}
                                            style={{
                                                left: `${tick.pct}%`,
                                            }}
                                        />

                                        {tick.isMajor && (
                                            <div
                                                className="tick-label"
                                                style={{
                                                    left: `${tick.pct}%`,
                                                }}
                                            >
                                                {tick.value
                                                    .toFixed(
                                                        tick.value < 1
                                                            ? 2
                                                            : tick.value < 10
                                                                ? 1
                                                                : 0
                                                    )
                                                    .replace(
                                                        /\.0+$/,
                                                        ""
                                                    )
                                                    .replace(
                                                        /(\.\d*?)0+$/,
                                                        "$1"
                                                    )}
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            <div
                                className={`marker guess ${dragging
                                    ? "dragging"
                                    : ""
                                    }`}
                                style={{
                                    left: `${guessPct}%`,
                                }}
                            >
                                <div className="marker-pole"></div>

                                <div className="marker-flag">
                                    {formatLength(
                                        guessM,
                                        unit
                                    )}
                                </div>
                            </div>

                            <input
                                type="range"
                                className="slider-input"
                                min="0"
                                max="1000"
                                step="1"
                                value={sliderValue}
                                onChange={
                                    handleSliderChange
                                }
                                onMouseDown={() =>
                                    setDragging(true)
                                }
                                onMouseUp={() =>
                                    setDragging(false)
                                }
                                onTouchStart={() =>
                                    setDragging(true)
                                }
                                onTouchEnd={() =>
                                    setDragging(false)
                                }
                                aria-label="Drag to set your guess"
                            />
                        </div>
                    </div>

                    <p className="guess-readout">
                        Your guess{" "}
                        <b>
                            {formatLength(
                                guessM,
                                unit
                            )}
                        </b>
                    </p>

                    <button
                        className="check-btn"
                        onClick={checkGuess}
                    >
                        Check my guess
                    </button>

                    <div className="score-bar">
                        <span>
                            Score

                            <span
                                className={`score-num ${scoreBump
                                    ? "bump"
                                    : ""
                                    }`}
                            >
                                {score} / {attempts}
                            </span>
                        </span>

                        <span>
                            Avg miss {avgMiss}
                        </span>
                    </div>
                </div>
            </div>

            <div
                className={`overlay ${showModal
                    ? "show"
                    : ""
                    }`}
            >
                {result && (
                    <div className="modal">
                        <p
                            className={`modal-verdict ${result.verdictClass}`}
                        >
                            {result.verdict}
                        </p>

                        <p className="modal-sub">
                            {result.subText}
                        </p>

                        <div className="scale-wrap modal-scale">
                            <div className="scale-track">
                                <div className="scale-rail"></div>

                                <div className="ticks-layer">
                                    {modalTicks.map(
                                        (tick, index) => (
                                            <React.Fragment
                                                key={index}
                                            >
                                                <div
                                                    className={`tick ${tick.isMajor
                                                        ? "major"
                                                        : "minor"
                                                        }`}
                                                    style={{
                                                        left: `${tick.pct}%`,
                                                    }}
                                                />

                                                {tick.isMajor && (
                                                    <div
                                                        className="tick-label"
                                                        style={{
                                                            left: `${tick.pct}%`,
                                                        }}
                                                    >
                                                        {tick.value
                                                            .toFixed(1)
                                                            .replace(
                                                                /\.0$/,
                                                                ""
                                                            )}
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        )
                                    )}
                                </div>

                                <div
                                    className="marker guess"
                                    style={{
                                        left: `${result.guessPct}%`,
                                    }}
                                >
                                    <div className="marker-pole"></div>
                                    <div className="marker-flag">
                                        YOU
                                    </div>
                                </div>

                                <div
                                    className="marker actual"
                                    style={{
                                        left: `${result.actualPct}%`,
                                    }}
                                >
                                    <div className="marker-pole"></div>
                                    <div className="marker-flag">
                                        REAL
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="stats-row">
                            <div className="stat-box">
                                <div className="stat-label">
                                    You said
                                </div>

                                <div className="stat-val">
                                    {formatLength(
                                        guessM,
                                        unit
                                    )}
                                </div>
                            </div>

                            <div className="stat-box">
                                <div className="stat-label">
                                    Actual
                                </div>

                                <div className="stat-val">
                                    {formatLength(
                                        result.actualM,
                                        unit
                                    )}
                                </div>
                            </div>

                            <div className="stat-box">
                                <div className="stat-label">
                                    Off by
                                </div>

                                <div className="stat-val">
                                    {result.offPct.toFixed(
                                        0
                                    )}
                                    %
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-again"
                                onClick={nextRound}
                            >
                                Next →
                            </button>

                            <button
                                className="btn-restart"
                                onClick={
                                    restartGame
                                }
                            >
                                Restart
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div
                className={`overlay ${showFinalScore ? "show" : ""}`}
            >
                <div className="modal final-modal">
                    <p className="modal-verdict hit">Game Over!</p>

                    <p className="modal-sub">
                        You guessed all {specimens.length} things.
                    </p>

                    <div className="stats-row">
                        <div className="stat-box">
                            <div className="stat-label">Score</div>
                            <div className="stat-val">
                                {score} / {attempts}
                            </div>
                        </div>

                        <div className="stat-box">
                            <div className="stat-label">Accuracy</div>
                            <div className="stat-val">
                                {attempts
                                    ? `${((score / attempts) * 100).toFixed(0)}%`
                                    : "—"}
                            </div>
                        </div>

                        <div className="stat-box">
                            <div className="stat-label">Avg Miss</div>
                            <div className="stat-val">{avgMiss}</div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn-again"
                            onClick={restartGame}
                        >
                            Play Again
                        </button>

                        <button
                            className="btn-restart"
                            onClick={quitGame}
                        >
                            Quit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
