const express = require('express')
//express
const app = express();
//cors
const cors = require('cors');
//dot env
require('dotenv').config()
//mongoDb
const { MongoClient } = require("mongodb");
//port
const port = process.env.PORT || 7000

//MiddleWare
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i3fcr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// console.log(uri);
async function run() {
    try {
        await client.connect();
        console.log('Database connected successfully');
        const database = client.db('medicare_features')
        const treatmentCollection = database.collection('treatments');

        //GET treatments
        app.get('/treatments', async (req, res) => {
            const cursor = treatmentCollection.find({});
            const treatments = await cursor.toArray();
            res.send(treatments);
        })
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

//==========================
app.get('/', (req, res) => {
    res.send('Hello Medico Portal!')
})

app.listen(port, () => {
    console.log(`Running at ${port}`)
})