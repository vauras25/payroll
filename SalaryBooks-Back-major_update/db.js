require('dotenv').config();
var mongoose = require('mongoose');

var mongoDB = process.env.MONGODBPATH;

// var mongoDB = process.env.MONGODBPATH;
const connectToDatabase = async () => {
    try {
        console.log(mongoDB,"mongoDBmongoDB");
        
        await mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected successfully!!');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
};

connectToDatabase(); // Call the async function to establish the connection

module.exports = mongoose.connection;

