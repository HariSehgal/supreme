import mongoose from"mongoose"
export const connectdb=async()=>{
 await mongoose.connect('').then(()=>{
        console.log("db connected");
    });
}
