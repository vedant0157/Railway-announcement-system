// src/config/dbConnection.js
const { MongoClient } = require('mongodb');

const dbURI = 'mongodb://localhost:27017';
const dbName = 'railway';

let db;

async function dbConnection() {
  if (db) return db;

  const client = new MongoClient(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  db = client.db(dbName);
  console.log('Connected to MongoDB:', dbURI);
  return db;
}

async function closeDB() {
  if (db) {
    await db.close();
    console.log('MongoDB connection closed');
  }
}

module.exports = { dbConnection, closeDB };
