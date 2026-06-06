import { Link, useNavigate } from 'react-router-dom';
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

    return (
        <div className="landing">
            <nav className="navbar">
                <div className="logo">Orion</div>
                <div className="nav-links">
                    <Link to="/login" className="btn-signup">Login</Link>
                    <Link to="/signup" className="btn-signup">Sign Up</Link>
                </div>
            </nav>

            <div className="card-container">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="card"
                        onClick={() => navigate(card.route)}
                    >
                        <img src={card.image} alt="" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default LandingPage;