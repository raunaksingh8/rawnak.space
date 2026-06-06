import { Link } from 'react-router-dom';
import '../styles/CardPage.css';

function CardPage({ title, subtitle }) {
    return (
        <div className="card-page">
            <nav className="card-page-navbar">
                <div className="logo">Orion</div>
                <Link to="/" className="card-page-back">Home</Link>
            </nav>

            <main className="card-page-content">
                <section className="card-page-header">
                    <div>
                        <h1>{title}</h1>
                        <p>{subtitle}</p>
                    </div>
                </section>

            </main>
        </div>
    );
}

export default CardPage;
