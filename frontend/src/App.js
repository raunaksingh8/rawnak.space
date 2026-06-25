import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useState, useEffect } from "react";
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/react';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Progress from './pages/Progress';
import LifeStats from './pages/LifeStats';
import DowryForm from './pages/DowryForm';
import FcBarcelona from './pages/FcBarcelona';
import MoneySpent from './pages/MoneySpent';
import Share from './pages/Share';
import SinceWhen from './pages/sincewhen';
import Admin from './pages/Admin';
import BirthHeatmap from './pages/birthheatmap';
import HowManyToday from './pages/howmanytoday';
import GuessTheLength from './pages/Guess';

function RouteTitleUpdater() {
    const location = useLocation();

    useEffect(() => {
        const routeTitles = {
            '/': 'Home',
            '/login': 'Login',
            '/signup': 'Sign Up',
            '/dashboard': 'Dashboard',
            '/progress': 'Progress',
            '/lifestats': 'Life Stats',
            '/dowrycal': 'Dowry Calculator',
            '/fcbarcelona': 'FC Barcelona',
            '/moneyspent': 'Money Spent',
            '/share': 'Share',
            '/since-when': 'Since When',
            '/admin': 'Admin',
            '/birthheatmap': 'India Live Birth Counter',
            '/howmanytoday': 'How Many Today',
            '/Guess': 'Guess The Length'
        };

        document.title = routeTitles[location.pathname] || 'Fullstack';
    }, [location.pathname]);

    return null;
}

function App() {

    const [token, setToken] = useState(localStorage.getItem("token"));

    return (
        <BrowserRouter>
            <RouteTitleUpdater />
            <ToastContainer position="top-right" autoClose={2000} />

            <Routes>

                <Route
                    path="/"
                    element={
                        token
                            ? <Navigate to="/dashboard" />
                            : <LandingPage />
                    }
                />
                <Route
                    path="/login"
                    element={
                        token
                            ? <Navigate to="/dashboard" />
                            : <Login setToken={setToken} />
                    }
                />
                <Route
                    path="/signup"
                    element={
                        token
                            ? <Navigate to="/dashboard" />
                            : <Signup />
                    }
                />
                <Route
                    path='/dashboard'
                    element={
                        token
                            ? <Dashboard setToken={setToken} />
                            : <Navigate to="/" />
                    }
                />
                <Route path="/progress" element={<Progress />} />
                <Route path="/lifestats" element={<LifeStats />} />
                <Route path="/dowrycal" element={<DowryForm />} />
                <Route path="/fcbarcelona" element={<FcBarcelona />} />
                <Route path="/moneyspent" element={<MoneySpent />} />
                <Route path="/share" element={<Share />} />
                <Route path="/since-when" element={<SinceWhen />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/birthheatmap" element={<BirthHeatmap />} />
                <Route path="/howmanytoday" element={<HowManyToday />} />
                <Route path="/Guess" element={<GuessTheLength />} />
                <Route
                    path="*"
                    element={
                        token
                            ? <Navigate to="/dashboard" />
                            : <Navigate to="/" />
                    }
                />
            </Routes>
            <Analytics />
        </BrowserRouter>
    );
}

export default App;
