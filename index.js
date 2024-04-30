const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('diy-task-management-server');
        const users = db.collection('users');
        const tasks = db.collection("tasks")

        // User Registration
        app.post('/api/v1/register', async (req, res) => {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existingUser = await users.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await users.insertOne({ name, email, password: hashedPassword });

            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        });

        // User Login
        app.post('/api/v1/login', async (req, res) => {
            const { email, password } = req.body;

           try {
             // Find user by email
             const user = await users.findOne({ email });
             if (!user) {
                 return res.status(401).json({ message: 'Invalid email or password' });
             }
 
             // Compare hashed password
             const isPasswordValid = await bcrypt.compare(password, user.password);
             if (!isPasswordValid) {
                 return res.status(401).json({ message: 'Invalid email or password' });
             }
 
             // Generate JWT token
             const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });
 
             res.json({
                 success: true,
                 message: 'Login successful',
                 token
             });
           } catch (error) {
            console.log(error)
            res.status(500).json({error: "Internal server error"})
           }
        });


        // ==============================================================
        // Application code starts from here
        // ==============================================================


// create a task post
app.post('/api/v1/tasks', async(req, res) => {
    const newTask = req.body

    try {
        const result  = await tasks.insertOne(newTask)
        res.status(201).json(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal server error"})
        
    }
})

// get all tasks post  

app.get('/api/v1/tasks', async(req, res) => {
try {
    const result = await tasks.find({}).toArray()
    res.status(200).json(result)
} catch (error) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({error: "Internal server error"})
        }
})

 // get single task post 
app.get('/api/v1/tasks/:id', async(req, res) => {
const taskId = req.params.id

try {
const result = await tasks.findOne({_id: new ObjectId(taskId)})
res.status(200).json({result})
} catch (error) {
console.log("Error fetching supply", error)
res.status(500).json({error: "Internal server error"})
}
})

 
// update task data into db
app.patch('/api/v1/tasks/:id', async (req, res) => {
const taskId = req.params.id;
const updatedTaskData = req.body; 
try {
const result = await tasks.updateOne(
{ _id: new ObjectId(taskId) },
{ $set: updatedTaskData }
);

if (result.matchedCount === 0) {
res.status(404).json({ error: 'Task not found' });
} else {
res.json({ message: 'Task updated successfully' });
}
} catch (err) {
console.error('Error updating Data:', err);
res.status(500).json({ error: 'Internal Server Error' });
}
});


//delete task post 
app.delete('/api/v1/tasks/:id', async(req, res) => {
const taskId = req.params.id

try {
const result = await tasks.deleteOne(
    {_id:new ObjectId(taskId)}
    )

if(result.deletedCount === 0){
    res.status(404).json({error: "Task not found."})
}
else{
    res.status(201).json({message: "Task deleted successfully"})
}
} catch (error) {
console.log("Can not delete the task.", error)
res.status(500).json({ error: 'Internal Server Error' });
}
})

        // test route to start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'DIY server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});