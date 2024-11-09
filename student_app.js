require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const connectDB = require("./DB/conn")
const app = express()
const PORT = process.env.PORT || 3100;
const axios = require('axios');

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


app.post('/addStudent', async (req, res) => {
    let data = req.body;
    let studentData ={};
    let schoolDetails = await  schoolModel.findOne({"schoolId": data.schoolId});

    if(schoolDetails){
        const studentDetails = new studentModel({
            name: data.name,
            age:data.age,
            schoolId: data.schoolId,

        });
        studentData = await studentDetails.save();
        let webhookUrl ="";
        for(let i=0; i<schoolDetails.webhookDetails.length; i++){
            if(schoolDetails.webhookDetails[i].eventName === "studen.add")
            webhookUrl = schoolDetails.webhookDetails[i].endpointUrl;
        }

        if(webhookUrl != null && webhookUrl.length>0){
            // webhook response
            let result = await axios.post(webhookUrl, studentData,{
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            console.log(" webhook data send")
        }

    }else
    {
        console.log(" NO school")
    }
    res.send({
        result:"added succesfully: "+studentData.name
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
