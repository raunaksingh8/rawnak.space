const express = require("express");
const app = express();
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

require ("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

app.use(morgan("dev"));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000'
  ]
}));
app.use(express.json());

app.get("/", (req, resp) => {
  resp.send("Backend is running");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is Working" });
});

app.post("/api/auth/signup", async(req, res) => {
  const { name,email, password } = req.body;
  try {
    // check if user already exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // save user
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    ); 
    // create token
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup Failed" })
  }
})

app.post("/api/auth/login",async(req,res)=>{
  const {name, email, password}= req.body;
  try{
const result = await pool.query("Select * from users where email = $1",[email])
if (result.rows.length === 0){
  return res.status(400).json({message:"Invalid Email id or password"});
}
const user = result.rows[0];
const isMatch = await bcrypt.compare(password, user.password);
if(!isMatch){
  return res.status(400).json({message:"Invalide email id or password"});
}
const token = jwt.sign({id:user.id},process.env.JWT_SECRET, {expiresIn: "7d"});
res.json({token,user:{id:user.id, name:user.name, email:user.email}});
  }catch(err){
    console.error(err);
    res.status(500).json({message:"Login Failed"});
    }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));