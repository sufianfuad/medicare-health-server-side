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

// const stripe = require('stripe')('sk_test_51JwAlyCTzT8XZQMxQP53mDjeRoYmeJgHVV9ffc5dcoZWkOEziz4hWtHsIhumVmQpb7m1UjmB1KKiZn2Hqv6Xkopq00YxAL49Ca')
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51JwAlyCTzT8XZQMxQP53mDjeRoYmeJgHVV9ffc5dcoZWkOEziz4hWtHsIhumVmQpb7m1UjmB1KKiZn2Hqv6Xkopq00YxAL49Ca');
//Image file upload
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

        //Review collection
        const reviewCollection = database.collection('reviews');
        //User Info Collection
        const userInfoCollection = database.collection('user_info');
        //Test Center Collection
        const testCenterCollection = database.collection('test_center');

        //===========>> GET API TestTreatments<<=============
        //GET treatments API
        app.get('/treatments', async (req, res) => {
            // console.log(req.query);
            const cursor = treatmentCollection.find({});
            const treatments = await cursor.toArray();
            res.send(treatments);
        });
        //GET Single treatment Load API
        app.get('/treatments/:id', async (req, res) => {
            const id = req.params?.id;
            console.log('specific treatment id', id);
            const query = { _id: ObjectId(id) };
            const treatment = await treatmentCollection.findOne(query);
            res.json(treatment);
        });

        //Treatments POST API
        app.post('/treatments', async (req, res) => {
            const treatment = await req.body;
            console.log('hit the post', treatment);
            const result = await treatmentCollection.insertOne(treatment);
            res.json(result);
            console.log(result);
        })


        //DELETE treatment
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
        });



        //===================================
        //All Profiles Collection
        app.get('/allProfiles', async (req, res) => {
            const result = await userInfoCollection.find({}).toArray();
            res.send(result);
        });
        //user Profile Info Collection
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




        //=============ADD Doctor API======================
        app.get('/add_doctor', async (req, res) => {
            const cursor = addDoctorCollection.find({});
            const addDoctors = await cursor.toArray();
            res.json(addDoctors)
        });

        //All addDoctor collect
        app.get('/allDoctors', async (req, res) => {
            const result = await addDoctorCollection.find({}).toArray();
            res.send(result);
        });

        // DELETE addDoctor API
        app.delete('/add_doctor/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await addDoctorCollection.deleteOne(query);
            console.log('delete doctor', result);
            res.json(result);
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

        //===========>> GET API Test Center <<=============
        //GET API
        app.get('/test_center', async (req, res) => {
            const cursor = testCenterCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });
        //POST API
        app.post('/test_center', async (req, res) => {
            const testCenter = req.body;
            console.log('hit the post api', testCenter);
            const result = await testCenterCollection.insertOne(testCenter);
            res.json(result);
            console.log(result)
        });

        //=============>> Reviews API <<===============
        //GET API
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        //POST API to send data in MongoDB
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            console.log('hitted', review);
            res.json(result);
        });



        //===========>> GET API Appointment <<=============


        //GET All Appointment API
        app.get('/allAppointments', async (req, res) => {
            const result = await appointmentsCollection.find({}).toArray();
            // const allAppointments = await cursor.toArray();
            // console.log(allAppointments);
            res.json(result)
        });
        // email and realtime date pawar jonno 
        app.get('/appointments', async (req, res) => {
            const email = req.query.email;
            const todayDates = new Date(req.query.todayDates).toDateString();
            // console.log(todayDates)
            const query = { email: email, todayDates: todayDates };
            // console.log(query)
            const cursor = appointmentsCollection.find(query);
            const appointments = await cursor.toArray();
            res.json(appointments);
        })
        //======Appointment GET =============
        app.get('/appointments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await appointmentsCollection.findOne(query);
            res.json(result);
        })
        //======Appointment POST =============
        app.post('/appointments', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentsCollection.insertOne(appointment);
            // console.log(appointment)
            // console.log(result)
            // res.json({ message: "hello" })
            res.json(result)
        });
        // update API korchi payment data load er jonno 
        app.put('/appointments/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    payment: payment
                }
            };
            const result = await appointmentsCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        //DELETE User Info API
        app.delete('/appointments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await appointmentsCollection.deleteOne(query);
            res.json(result);
            // console.log('delete appointment', result);
            // console.log(result);
        });

        //Payment API from STRIPE
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
                // automatic_payment_methods: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        })

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