import { useEffect, useState } from 'react';
import axios from "axios";

import './App.css';

function App() {
  const [message, setMessage]=useState("");

  useEffect (()=>{
    axios.get("http://localhost:5000/api/test").then(res=> setMessage(res.data.message));
  },[]);
  return (
    <h1>{message}</h1>
  );
}

export default App;
