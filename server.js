import express from "express"
import cors from "cors"
import { connectdb } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import "dotenv/config.js"
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
const app=express();

const port=4000;
app.use(express.json())
app.use(cors());
connectdb();

app.use("/api/food",foodRouter)
app.use("/images",express.static('uploads'))
app.use("/api/user",userRouter)
app.use("/api/order",orderRouter)
app.get("/",(req,res)=>{
    res.send("api working");
})
app.use("/api/cart",cartRouter)
app.listen(port,()=>{
    console.log(`server started on http://localhost:${port}`)
})


