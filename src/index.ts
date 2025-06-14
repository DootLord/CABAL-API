import express from 'express';
import { Db, MongoClient } from 'mongodb';

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const dbName = process.env.DB_NAME || 'cabal';

// Use the provided MONGO_URI environment variable or fallback to localhost for local development
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017';

let db: Db | null = null;

async function connectToDatabase() {
    try {
        const client = new MongoClient(mongoURI);
        await client.connect();
        db = client.db(dbName);
        console.log(`Connected to database: ${dbName}`);
    } catch (err) {
        console.error('Failed to connect to the database');
        console.error(err);
        process.exit(1);
    }
}

app.get('/note', async (_req, res): Promise<void> => {
    if (!db) {
        res.status(500).send('Database not connected');
        return;
    }

    try {
        const notes = await db.collection('notes').find({}).toArray();
        res.json(notes);
    } catch (err) {
        console.error('Error fetching notes:', err);
        res.status(500).send('Error fetching notes');
    }
});

app.post('/note', async (req, res): Promise<void> => {
    if (!db) {
        res.status(500).send('Database not connected');
        return;
    }

    const note = req.body.note;

    if (!note) {
        res.status(400).send('Note content is required');
        return;
    }

    const noteObject = {
        content: note,
        createdAt: Math.floor(Date.now() / 1000)
    }

    try {
        const result = await db.collection('notes').insertOne(noteObject);
        res.status(201).json({ _id: result.insertedId, ...noteObject });
    } catch (err) {
        console.error('Error creating note:', err);
        res.status(500).send('Error creating note');
    }
});

app.listen(port, async () => {
    await connectToDatabase();
    console.log(`Server is running on http://localhost:${port}`);
})