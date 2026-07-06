import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import '../styles/Signup.css';
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import Loader from "../components/Loader";
import { useTrackView } from "../hooks/useTrackView";

function Signup() {

    useTrackView("Signup");

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password) {
            toast.error("All fields are required !");
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/signup`, {
                name,
                email,
                password
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success("Signup Completed ! Please Login");
            navigate('/login');
        } catch (err) {
            toast.error(err.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signuppage">
            <div className="signup-container">
                <h2>Create Account</h2>
                {error && <p className="error">{error}</p>}
                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <div className="password-wrapper">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />

                    <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VscEyeClosed /> : <VscEye />}
                    </span>
                </div>
                <button onClick={handleSignup} disabled={loading}>Signup
                </button>
                {loading && <Loader />}
                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
                <p className="p1"><Link to="/landingpage">Go Back</Link></p>
            </div>
        </div>
    );
}

export default Signup;