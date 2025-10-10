import express from "express"
import cors from "cors"
import { connectdb } from "./config/db.js";

import "dotenv/config.js"

const app=express();

const port=4000;
app.use(express.json())
app.use(cors());
connectdb();

app.listen(port,()=>{
    console.log(`server started on http://localhost:${port}`)
})


