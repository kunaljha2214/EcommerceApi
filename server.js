const express = require('express');
const  connectDB = require('./config/db')
const app = express()
const userRoute = require('./routes/user')
const productRoute = require('./routes/products')
const orderRoute = require('./routes/orders')

connectDB()

PORT = process.env.PORT|| 5000;

app.use('/uploads', express.static('uploads'))
app.use('/api/auth',userRoute);
app.use('/api/products',productRoute)
app.use('/api/orders',orderRoute)

app.listen(PORT,()=>{
    console.log(`server started at ${PORT}`)
})

