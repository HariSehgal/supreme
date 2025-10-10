import mongoose from"mongoose"
export const connectdb=async()=>{
 await mongoose.connect('mongodb+srv://anubhav:KnVhdRa9gnVO2jB1@cluster0.8jzyu64.mongodb.net/?retryWrites=true&w=majority&appName=supreme').then(()=>{
        console.log("db connected");
    });
}