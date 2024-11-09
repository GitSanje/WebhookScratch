require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const connectDB = require("./DB/conn")
const app = express()
const PORT = process.env.PORT || 3100;

const {schoolModel } = require('./models/schoolModel')
const {studentModel } = require('./models/studentModel')


connectDB()
app.use(bodyParser.json())

app.get('/',(req, res) => {
    res.send("welcome to student data application");
})

app.post('/registerSchool', async (req, res) => {
    let data = req.body;

    // Use countDocuments() to count the number of schools in the database
    const index = await schoolModel.countDocuments();  // Updated line

    const schoolDetails = new schoolModel({
        schoolName: data.schoolName,
        schoolId: index + 1,  // Increment index to generate unique schoolId
    });

    let schoolData = await schoolDetails.save();

    res.send({
        result: schoolData
    });
});



app.post('/addWebhookEvent', async(req, res) => {
    let data = req.body;

    let schoolDetails = await  schoolModel.findOne({"schoolId": data.schoolId});
    if(schoolDetails){
        if(schoolDetails.webhookDetails == null){
            schoolDetails.webhookDetails =[];
        }
        schoolDetails.webhookDetails.push({
            eventName: data.eventName,
            endpointUrl: data.endpointUrl
        });
        schoolDetails = await schoolModel.findOneAndUpdate(
            {"schoolId": schoolDetails.schoolId}, schoolDetails,{
                returnOriginal: false
            })
    }else
    {
        console.log(" NO school")
    }
    res.send({
        result:schoolDetails
    });
})



mongoose.connection.once('open', () => {
    console.log('connected to MongoDB')
    app.listen(PORT, () => console.log(`server running at http://localhost:${PORT}`))
 }
)

mongoose.connection.on('error', err => {
    console.log(err)
    
})
