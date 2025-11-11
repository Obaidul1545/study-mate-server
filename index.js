const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// Middleqares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://studyMate:CrqnbJMsv6mO3hCJ@cluster0.utubuxm.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get('/', (req, res) => {
  res.send('Server is Running');
});

async function run() {
  try {
    await client.connect();

    const db = client.db('studyMate');
    const partnersCollection = db.collection('partners');

    // create partners
    app.post('/partners', async (req, res) => {
      const newPartner = req.body;
      const result = await partnersCollection.insertOne(newPartner);
      res.send(result);
    });

    // get All partners
    app.get('/partners', async (req, res) => {
      const result = await partnersCollection.find().toArray();
      res.send(result);
    });

    // partner details
    app.get('/partner/:id', async (req, res) => {
      const { id } = req.params;
      const result = await partnersCollection
        .findOne({
          _id: new ObjectId(id),
        })
        .toArray();
      res.send(result);
    });

    // top partners
    app.get('/top-partners', async (req, res) => {
      const result = await partnersCollection
        .find()
        .sort({ rating: -1 })
        .limit(3)
        .toArray();
      res.send(result);
    });

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`StudyMate app listening on port ${port}`);
});
