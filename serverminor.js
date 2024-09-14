const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore(); // Firebase Firestore instance

const app = express();
let initialPath = path.join(__dirname, "public");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(initialPath));

// Serve home page
app.get('/', (req, res) => {
    res.sendFile(path.join(initialPath, "home.html"));
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(initialPath, "login.html"));
});

// Serve signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(initialPath, "signup.html"));
});

// Register a new user
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json('Please fill all the fields');
    }

    try {
        // Check if the user already exists
        const usersSnapshot = await db.collection('users').where('email', '==', email).get();
        if (!usersSnapshot.empty) {
            return res.status(500).json('Email already exists');
        }

        // Add new user to Firestore
        await db.collection("users").add({
            name,
            email,
            password
        });

        res.sendFile(path.join(initialPath, "login.html")); // Redirect to login after signup
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json('Error during signup');
    }
});

// Login an existing user
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json('Please fill all the fields');
    }

    try {
        // Query the Firestore database for the user by email
        const usersSnapshot = await db.collection('users').where('email', '==', email).get();

        if (usersSnapshot.empty) {
            return res.json('Email or password is incorrect');
        }

        // Loop through the results (in case there are multiple users with the same email)
        let userFound = false;
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.password === password) {
                userFound = true;
                res.redirect('http://localhost:3000/model');
            }
        });

        if (!userFound) {
            return res.json('Email or password is incorrect');
        }

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json('Error logging in user');
    }
    
});

// Listen on port 3000
app.listen(4000, () => {
    console.log('Server is running on port 4000...');
});
