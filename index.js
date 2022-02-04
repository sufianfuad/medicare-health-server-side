//express
const express = require('express');
//cors
const cors = require('cors');
//admin seq
const admin = require("firebase-admin");

//mongoDb
const { MongoClient } = require("mongodb");
//OBJ ID MISSING
const ObjectId = require('mongodb').ObjectId;
//
const fileUpload = require('express-fileupload')
//dot env
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7000;


const serviceAccount = require('./medi-care-hospital-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


//MiddleWare
app.use(cors());
app.use(express.json());
app.use(fileUpload());

//========
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i3fcr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
//==
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}
// console.log(uri);
async function run() {
    try {
        await client.connect();
        // console.log('Database connected successfully');
        const database = client.db('medicare_features');
        //Treatment collection
        const treatmentCollection = database.collection('treatments');
        //Appointment collection
        const appointmentsCollection = database.collection('appointments');
        //User collection
        const usersCollection = database.collection('users');
        //Doctor collection
        const doctorsCollection = database.collection('doctors');
        const addDoctorCollection = database.collection('add_doctor');
        //Attendee collection
        const attendeesCollection = database.collection('attendees');
        //==
        const volunteerCollection = database.collection('volunteers');
        //Order collection
        const orderCollection = database.collection('orders');
        //Review collection
        const reviewCollection = database.collection('reviews');
        const userInfoCollection = database.collection('user_info');

        //GET treatments API
        app.get('/treatments', async (req, res) => {
            console.log(req.query);
            const cursor = treatmentCollection.find({});
            const treatments = await cursor.toArray();
            // const count = await cursor.count();
            res.send({
                // count,
                treatments
            });
        });

        //Treatments POST API
        app.post('/treatments', async (req, res) => {
            const treatment = req.body;
            const result = await treatmentCollection.insertOne(treatment);
            res.json(result);
            console.log(result);
        })
        //GET Single treatment Load API
        //coming...............

        //DELETE products
        app.delete('/treatments/:id', async (req, res) => {
            // const id = req.params.id;
            const query = { _id: ObjectId(req.params.id) };
            const result = await treatmentCollection.deleteOne(query);
            res.json(result);
        });
        //===================================================//
        //USER GET API
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            //aitkane await missing chilo
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        //USER POST API
        app.post('/users', async (req, res) => {
            const user = req.body;
            //aitkane await missing chilo
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result)
        });

        //USER PUT
        app.put('/users', async (req, res) => {
            const user = req.body;
            // console.log('PUT', user);
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // PUT Make ADMIN USER 
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            // console.log('PUT', req.decodedEmail);
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user?.email }
                    const updateDoc = { $set: { role: 'admin' } }

                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                //user unauthorize
                res.status(403).json({ message: 'You do not have access to make admin' })
            }
        })
        //===================================================//

        // GET Doctor
        app.get('/doctors', async (req, res) => {
            const cursor = doctorsCollection.find({});
            const doctor = await cursor.toArray();
            res.send(doctor);
        });

        //Doctor GET
        app.get('/doctors/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const doctor = await doctorsCollection.findOne(query);
            let isDoctor = false;
            if (doctor?.role === 'doctor') {
                isDoctor = true;
            }
            res.json({ doctor: isDoctor });
        })

        // Doctor POST
        app.post('/doctors', async (req, res) => {
            const doctor = req.body;
            const result = await doctorsCollection.insertOne(doctor)
            res.json(result)
            console.log(result);
        })
        // doctors put for doctor role
        app.put('/doctors/doctor', async (req, res) => {
            const doctor = req.body;
            console.log('put', doctor);
            const filter = { email: doctor.email }
            const updateDoc = { $set: { role: 'doctor' } };
            const result = await doctorsCollection.updateOne(filter, updateDoc)
            res.json(result);
        })

        app.put('/doctors', async (req, res) => {
            const doctor = req.body;
            const filter = { email: doctor.email };
            const options = { upsert: true };
            const updateDoc = { $set: doctor };
            const result = await doctorsCollection.updateOne(filter, updateDoc, options);
            console.log(result);
            res.json(result);
        })
        //=========================
        //user Info Collection
        app.get('/user_info', async (req, res) => {
            const cursor = userInfoCollection.find({});
            const userInfo = await cursor.toArray();
            res.send(userInfo)
        })
        app.post('/user_info', async (req, res) => {
            const userInfo = req.body;
            console.log(userInfo);
            const result = await userInfoCollection.insertOne(userInfo);
            res.send(result)
            console.log(result);
        });
        // users single data GET 
        app.get('/user_info/:email', async (req, res) => {
            const query = { email: req.params.email };
            const result = await userInfoCollection.find(query).toArray();
            res.json(result);
        });

        //DELETE User Info API
        app.delete('/user_info/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userInfoCollection.deleteOne(query);
            res.json(result);
            console.log(result);
        });


        //===================================
        app.get('/add_doctor', async (req, res) => {
            const cursor = addDoctorCollection.find({});
            const addDoctors = await cursor.toArray();
            res.json(addDoctors)
        });

        app.post('/add_doctor', async (req, res) => {
            // console.log('body', req.body);
            // console.log('files', req.files);
            res.json({ success: true })
            const doctorName = req.body.doctorName;
            const doctorEmail = req.body.doctorEmail;
            const pic = req.files.doctorPic;
            const picData = pic.data;
            const encodedPic = picData.toString('base64')
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const doctor = {
                doctorName,
                doctorEmail,
                doctorPic: imageBuffer
            }
            const result = await addDoctorCollection.insertOne(doctor)
            res.json(result)
            console.log(result);
        });

















        // get doctor
        // app.get('/doctors', async (req, res) => {
        //     const cursor = doctorsCollection.find({});
        //     const doctor = await cursor.toArray();
        //     res.send(doctor);
        // });

        //For Doctor
        // app.get('/doctors/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email: email };
        //     const doctor = await usersCollection.findOne(query);
        //     let isDoctor = false;
        //     if (doctor?.role === 'doctor') {
        //         isDoctor = true;
        //     }
        //     res.json({ doctor: isDoctor });
        // });

        //Doctor POST API
        // app.post('/doctors', async (req, res) => {
        //     const doctor = req.body;
        //     const result = await usersCollection.insertOne(doctor);
        //     console.log(result);
        //     res.json(result)
        // });
        // app.put('/doctors', async (req, res) => {
        //     const doctor = req.body;
        //     const filter = { email: doctor.email };
        //     const options = { upsert: true };
        //     const updateDoc = { $set: doctor };
        //     const result = await doctorsCollection.updateOne(filter, updateDoc, options);
        //     console.log(result);
        //     res.json(result);
        // })
        // set doctor role set
        // app.put('/doctors/doctor', async (req, res) => {
        //     const doctor = req.body;
        //     console.log('put', doctor);
        //     const filter = { email: doctor.email };
        //     const updateDoc = { $set: { role: 'doctor' } }
        //     const result = await doctorsCollection.updateOne(filter, updateDoc);
        //     res.json(result);
        // });
        //===================================================//
        // attendee role
        // app.get('/attendees/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email: email };
        //     const attendee = await attendeesCollection.findOne(query);
        //     let isAttendee = false;
        //     if (attendee?.role === 'attendee') {
        //         isAttendee = true;
        //     }
        //     res.json({ attendee: isAttendee });
        // })

        // app.post('/attendees', async (req, res) => {
        //     const attendee = req.body;
        //     const result = await attendeesCollection.insertOne(attendee);
        //     console.log(result);
        //     res.json(result);
        // });

        // app.put('/attendees', async (req, res) => {
        //     const attendee = req.body;
        //     const filter = { email: attendee.email };
        //     const options = { upsert: true };
        //     const updateDoc = { $set: attendee };
        //     const result = await attendeesCollection.updateOne(filter, updateDoc, options);
        //     console.log(result);
        //     res.json(result);
        // })
        // get api for attendee
        // app.get('/attendees', async (req, res) => {
        //     const cursor = attendeesCollection.find({});
        //     const attendee = await cursor.toArray();
        //     res.send(attendee);
        // });
        // set role set
        // app.put('/attendees/attendee', async (req, res) => {
        //     const attendee = req.body;
        //     console.log('put', attendee);
        //     const filter = { email: attendee.email };
        //     const updateDoc = { $set: { role: 'attendee' } };
        //     const result = await attendeesCollection.updateOne(filter, updateDoc);
        //     res.json(result);
        // });
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

//==========================
app.get('/', (req, res) => {
    res.send('Hello Medicare Portal!')
})

app.listen(port, () => {
    console.log(`Medicare Running at ${port}`)
})