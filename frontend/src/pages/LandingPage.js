import { Link, useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

function LandingPage() {
    const navigate = useNavigate();

    const cards = [
        { image: "/images/progress.svg", route: "/dashboard" },
        { image: "/images/lifestats.svg", route: "/users" },
        { image: "/images/dowrycal.svg", route: "/reports" },
        { image: "/images/fcbarcelona.svg", route: "/settings" },
        { image: "/images/moneyspent.svg", route: "/notifications" },
        { image: "/images/share.svg", route: "/support" }
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