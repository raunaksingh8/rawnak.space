import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '../styles/LandingPage.css';

function LandingPage() {
    const navigate = useNavigate();

    const cards = [
        { image: "/images/progress.svg", route: "/progress" },
        { image: "/images/lifestats.svg", route: "/lifestats" },
        { image: "/images/dowrycal.svg", route: "/dowrycal" },
        { image: "/images/fcbarcelona.svg", route: "/fcbarcelona" },
        { image: "/images/moneyspent.svg", route: "/moneyspent" },
        { image: "/images/share.svg", route: "/share" }
    ];

    const [isLeaving, setIsLeaving] = useState(false);
    const [clickedIndex, setClickedIndex] = useState(null);

    const handleCardClick = (route, index) => {
        if (isLeaving) return;
        setClickedIndex(index);
        setIsLeaving(true);
        setTimeout(() => navigate(route), 380);
    };

    return (
        <div className={`landing ${isLeaving ? 'is-leaving' : ''}`}>
            <nav className="navbar">
                <div className="logo" aria-hidden="true"></div>
                <div className="nav-links">
                    <Link to="/login" className="btn-signup">Login</Link>
                    <Link to="/signup" className="btn-signup">Sign Up</Link>
                </div>
            </nav>

            <div className={`landing-intro ${isLeaving ? 'is-leaving' : ''}`}>
                <div className="card-container">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`card ${clickedIndex === index ? 'clicked' : ''}`}
                        onClick={() => handleCardClick(card.route, index)}
                    >
                        <img src={card.image} alt="" />
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
}

export default LandingPage;
