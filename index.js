const uuid = require('uuid');
const express = require('express');
const mysql = require('mysql');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// MySQL Connection Configuration
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

const keys = {
  READ: process.env.READ_KEY,
  WRITE: process.env.WRITE_KEY,
  UPDATE: process.env.UPDATE_KEY,
  ADD: process.env.ADD_KEY,
};

// // Middleware for key validation

const validateKey = (req, res, next) => {
  const { query, key } = req.query;

  // Check if the provided key matches the required key for the given operation
  if (key !== keys[query]) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // If the key is valid, continue to the next middleware or route handler
  next();
};



// Apply the middleware to the /api route
app.use('/api', validateKey);




// Express Route with Parameterized Query

//READ

app.get('/api', validateKey, (req, res) => {
  const { id } = req.query;

  console.log('Received id:', id); // Log the received id

  if (!id) {
    console.log('No id parameter provided');
    return res.status(400).json({ error: 'No id parameter provided' });
  }

  // Perform database connection with Parameterized Query
  db.query('SELECT * FROM records WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    console.log('Executed SQL query:', 'SELECT * FROM records WHERE id = ?', [id]); // Log the executed SQL query

    // Check if any records were found
    if (results.length === 0) {
      console.log('No records found for id:', id); // Log if no records were found
      return res.status(404).json({ error: 'No records found' });
    }

    // Extract the entry timestamp from the first record (assuming there's only one)
    const entryTimestamp = results[0].createdAt;

    console.log('Query executed successfully:', results);

    // Send back the results along with the entry timestamp
    res.json({ message: 'Query executed successfully', entryTimestamp });
  });
});


//WRITE
app.post('/api', validateKey, (req, res) => {
 
  const newUuid = uuid.v4();

  const payload = {

    id: newUuid,
    createdAt: new Date()

  };

  // Perform database connection with Parameterized Query
  db.query('INSERT INTO records SET ?', [payload], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    console.log('Query executed successfully:', results);

    // Send back the results
    res.json(results);
  });
});

//UPDATE

app.put('/api', validateKey, (req, res) => {
  const { query, values } = req.body;

     db.query(query, values, (err, results) => {
      if (err) {
        console.error('MySQL query error:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
      }
  
 console.log('Query executed successfully:', results);

    // Send back the results
    res.json(results);
  });
});



//ADD
app.put('/api/add', validateKey, (req, res) => {
  const { payload } = req.body;

  // Perform database connection with Parameterized Query
  db.query('INSERT INTO records SET ?', [payload], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    console.log('Query executed successfully:', results);

    // Send back the results
    res.json(results);
  });
});





// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
