import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/LandingPage.css';


function LandingPage() {
    const navigate = useNavigate();


    const cards = [
        { image: "/images/sincewhen.svg", route: "/since-when" },
        { image: "/images/lifestats.svg", route: "/lifestats" },
        { image: "/images/dowrycal.svg", route: "/dowrycal" },
        { image: "/images/fcbarcelona.svg", route: "/fcbarcelona" },
        { image: "/images/moneyspent.svg", route: "/moneyspent" },
        { image: "/images/progress.svg", route: "/progress" },
        { image: "/images/share.svg", route: "/share" }
    ];


    const [isLeaving, setIsLeaving] = useState(false);
    const [clickedIndex, setClickedIndex] = useState(null);




    useEffect(() => {
        /* Lock page scroll while the landing page is active.
           This was previously a global CSS rule that broke scroll on other pages. */
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

    // useEffect(() => {
    //     document.querySelectorAll('.emoji-border').forEach(el => {
    //         el.textContent = '🌻'.repeat(500);
    //     });
    // }, []);


    const handleCardClick = (route, index) => {
        if (isLeaving) return;
        setClickedIndex(index);
        setIsLeaving(true);
        setTimeout(() => navigate(route), 380);
    };






    return (
        <div className={`landing ${isLeaving ? 'is-leaving' : ''}`}>
            <div className="emoji-border top"></div>
            <div className="emoji-border bottom"></div>
            <div className="emoji-border left"></div>
            <div className="emoji-border right"></div>


            {/* <nav className="navbar">
                <div className="logo" aria-hidden="true"></div>
                <div className="nav-links">
                    <Link to="/login" className="btn-signup">Login</Link>
                    <Link to="/signup" className="btn-signup">Sign Up</Link>
                </div>
            </nav> */}


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


            {/* Neal.fun-style Footer */}
            <footer className="neal-footer">
                <div className="neal-footer-inner">
                    <div className="made-by-desc">
                        Hi, I'm Raunak. I spend my time building weird, useful, and sometimes surprising things on the web. Here are some links worth checking out.
                    </div>


                    <div className="socials">
                        {/* <a href="mailto:imraunak5577@gmail.com" className="social-btn social-full newsletter-btn">
                            <svg className="social-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="M22 4L12 13L2 4" />
                            </svg>
                            <span>Newsletter</span>
                        </a> */}


                        <a href="https://twitter.com/raunaqueue" target="_blank" rel="noopener noreferrer" className="social-btn social-full twitter-btn">
                            <svg className="social-btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span>Twitter</span>
                        </a>
                    </div>


                    <div className="contact">
                        <span className="contact-label">Contact - </span>
                        <a href="mailto:neal@neal.fun">imraunak5577@gmail.com</a>
                    </div>


                    <a href="/privacy-policy" className="privacy">Privacy policy</a>
                </div>


            </footer>
        </div>
    );
}


export default LandingPage;