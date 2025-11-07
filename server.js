const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// MongoDB connection string
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'eventGuideDB';
const COLLECTION_NAME = 'events';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB client
let db;
let eventsCollection;

// Connect to MongoDB
MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
  .then(client => {
    console.log('✅ Connected to MongoDB successfully');
    db = client.db(DB_NAME);
    eventsCollection = db.collection(COLLECTION_NAME);
  })
  .catch(error => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Routes

// GET: Fetch all events
app.get('/api/events', async (req, res) => {
  try {
    const events = await eventsCollection.find({}).sort({ date: 1 }).toArray();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Fetch single event by ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await eventsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (event) {
      res.json({ success: true, data: event });
    } else {
      res.status(404).json({ success: false, message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Create new event
app.post('/api/events', async (req, res) => {
  try {
    const eventData = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      time: req.body.time,
      location: req.body.location,
      category: req.body.category,
      organizer: req.body.organizer,
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      imageUrl: req.body.imageUrl || 'https://via.placeholder.com/400x300',
      isFree: req.body.isFree !== false,
      attendees: [],
      createdAt: new Date()
    };

    const result = await eventsCollection.insertOne(eventData);
    res.status(201).json({ 
      success: true, 
      message: 'Event created successfully',
      data: { _id: result.insertedId, ...eventData }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT: Update event
app.put('/api/events/:id', async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      time: req.body.time,
      location: req.body.location,
      category: req.body.category,
      organizer: req.body.organizer,
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      imageUrl: req.body.imageUrl,
      isFree: req.body.isFree,
      updatedAt: new Date()
    };

    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount > 0) {
      res.json({ success: true, message: 'Event updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE: Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount > 0) {
      res.json({ success: true, message: 'Event deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: RSVP to event
app.post('/api/events/:id/rsvp', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $push: { 
          attendees: { 
            name, 
            email, 
            rsvpDate: new Date() 
          } 
        } 
      }
    );

    if (result.matchedCount > 0) {
      res.json({ success: true, message: 'RSVP successful!' });
    } else {
      res.status(404).json({ success: false, message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Search events
app.get('/api/events/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const events = await eventsCollection.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    }).toArray();
    
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Filter events by category
app.get('/api/events/category/:category', async (req, res) => {
  try {
    const events = await eventsCollection.find({ 
      category: req.params.category 
    }).sort({ date: 1 }).toArray();
    
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/events`);
});
