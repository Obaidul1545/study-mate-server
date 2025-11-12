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
    const requestsCollection = db.collection('requests');

    // create partners
    app.post('/partners', async (req, res) => {
      const newPartner = req.body;
      const result = await partnersCollection.insertOne(newPartner);
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

    // get All partners
    app.get('/partners', async (req, res) => {
      const result = await partnersCollection.find().toArray();
      res.send(result);
    });

    // partner details
    app.get('/partner/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await partnersCollection.findOne(query);
      res.send(result);
    });

    //send partner request
    app.post('/send-request/:id', async (req, res) => {
      const { id } = req.params;
      const { userEmail } = req.body;
      const query = { _id: new ObjectId(id) };
      const alreadySent = await requestsCollection.findOne({
        partnerId: id,
        senderEmail: userEmail,
      });
      if (alreadySent) {
        return res.send({
          success: false,
          message: 'You already sent a request to this partner!',
        });
      }
      await partnersCollection.updateOne(query, {
        $inc: { partnerCount: 1 },
      });
      const partner = await partnersCollection.findOne(query);
      const newRequest = {
        partnerId: id,
        partnerName: partner.name,
        partnerEmail: partner.email,
        partnerSubject: partner.subject,
        partnerStudyMode: partner.studyMode,
        partnerImage: partner.profileimage,
        senderEmail: userEmail,
        createdAt: new Date(),
      };
      const result = await requestsCollection.insertOne(newRequest);
      res.send({
        success: true,
        message: 'Partner request sent successfully!',
        result,
      });
    });

    // get all request
    app.get('/all-requests', async (req, res) => {
      const { email } = req.query;
      if (!email) {
        return res.status(400).send({ message: 'Email is required' });
      }
      const requests = await requestsCollection
        .find({ senderEmail: email })

        .sort({
          createdAt: -1,
        })
        .toArray();
      res.send(requests);
    });

    // delete Request
    app.delete('/all-requests/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await requestsCollection.deleteOne(query);
      res.send(result);
    });

    // update Request
    app.put('/all-requests/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const result = await requestsCollection.updateOne(query, {
        $set: updatedData,
      });
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
