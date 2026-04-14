import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';

function App() {
    const token = localStorage.getItem('token');

    return (
        <BrowserRouter>
         <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
                <Route path='/' element={token ? <Home /> : <Navigate to="/login" />} />
                <Route path='/login' element={<Login />} />
                <Route path='/signup' element={<Signup />} />
                <Route path='*' element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;