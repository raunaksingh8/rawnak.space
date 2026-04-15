import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import '../styles/Signup.css';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error] = useState('');
    const navigate = useNavigate();

    const handleSignup = async () => {
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/signup`, {
                name,
                email,
                password
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success("Signup Completed ! Please Login");
            navigate('/');
        } catch (err) {
            toast.error(err.response.data.message);
        }
    };

    return (
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
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <button onClick={handleSignup}>Sign Up</button>
            <p>
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    );
}

export default Signup;