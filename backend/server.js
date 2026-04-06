const express = require("express");
const app= express();
const cors = require("cors");

const {Pool} = require("pg");

const pool = new Pool({
    user:"postgres",
    host:"localhost",
    database:"myapp",
    password:"postgres",
    port:5432,
})

app.use(cors());
app.use(express.json());

app.get("/",(req,resp)=>{
    resp.send("Backend is running");
})

app.get("/api/test", (req,res)=>{
    res.json({message : "API is Working"});
});

app.get("/api/users",async(req,res)=>{
    try{
        const result = await pool.query("Select * from users");
        res.json(result.rows);
    }catch (err){
        console.error(err);
        res.status(500).send("Error fetching users");
    }
});

app.listen(5000, () => console.log("Server is running on port 5000"));