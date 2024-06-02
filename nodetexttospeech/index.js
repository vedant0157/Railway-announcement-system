const textToSpeech = require('@google-cloud/text-to-speech')
const express = require('express');
const bodyParser = require('body-parser');
const { dbConnection } = require('./dbConnection');
const axios = require('axios');
const player = require('play-sound')({ player: "vlc" });

const path = require('path');
const app = express();
const port = 3000;
const fs = require('fs')
const util = require('util');

//  to store environment variable to provide security to the credentials
require('dotenv').config()

app.use(bodyParser.json())

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.post('/api/train', async (req, res) => {
  const db = await dbConnection();
  const trainsCollection = db.collection('train');

  try {

    const trainNumber = req.body.trainNumber;
    const trainName = req.body.trainName;

    const train = { trainNumber, trainName };
    await trainsCollection.insertOne(train);
    res.status(201).send(train);
  } catch (error) {
    console.log("error", error)
    res.status(400).send(error);
  }
});


app.post('/api/train/trainNumber', async (req, res) => {
  const db = await dbConnection();
  const trainsCollection = db.collection('train');

  try {
    let trainNumber = req.body.trainNumber;
    const platformNumber = req.body.platformNumber;
    let trainTime = req.body.trainTime;

    trainTime = trainTime.replace(':', ' ');


    const train = await trainsCollection.findOne({ trainNumber: trainNumber });
    console.log(`Train Details Found : trainNumber:-> ${train.trainNumber}`);

    if (!train) {
      return res.status(404).send(`Train ${trainNumber} not found`);
    }
    let trainNumberNew = train.trainNumber;
    trainNumber = trainNumberNew.split('').join(' ');

    const client = new textToSpeech.TextToSpeechClient();
    
    async function convertTextToMp3() {
      const requests = [
        { text: `May I have your attention please? Train number ${trainNumber}, the ${train.trainName}, is arriving on platform number ${platformNumber} on ${trainTime}. Passengers are requested to please stand behind the yellow line. Please do not cross the tracks. Thank you. `, languageCode: 'en-IN' },
        { text: `यात्रिगण कृपया ध्यान दें। गाड़ी संख्या ${trainNumber}, ${train.trainName}, प्लेटफार्म संख्या ${platformNumber} पर ${trainTime} बजे आ रही है। यात्री कृपया पीली रेखा के पीछे खड़े रहें। कृपया पटरियाँ पार न करें। धन्यवाद। `, languageCode: 'hi-IN' },
        { text: `यात्रेकरूंनी कृपया लक्ष द्यावे. गाडी क्रमांक ${trainNumber}, ${train.trainName}, प्लॅटफॉर्म क्रमांक ${platformNumber} वर ${trainTime} वाजता येत आहे. प्रवाशांनी कृपया पिवळ्या रेषेच्या मागे उभे राहावे. कृपया रुळ ओलांडू नका. धन्यवाद. `, languageCode: 'mr-IN' }
    ];

      let combinedAudioContent = Buffer.alloc(0); // Initialize an empty buffer

      for (let i = 0; i < requests.length; i++) {
          const request = {
              input: { text: requests[i].text },
              voice: { languageCode: requests[i].languageCode, ssmlGender: 'NEUTRAL' },
              audioConfig: { audioEncoding: 'MP3' }
          };
  
          const [response] = await client.synthesizeSpeech(request);
          combinedAudioContent = Buffer.concat([combinedAudioContent, response.audioContent]);
      }
      const writeFile = util.promisify(fs.writeFile)
      await writeFile("output.mp3", combinedAudioContent, 'binary')

      const filePath = 'C:\\Users\\Vedant\\Desktop\\Project\\nodetexttospeech\\output.mp3';

      // Verify the file exists before attempting to play it
      if (fs.existsSync(filePath)) {
        console.log("File exists, attempting to play it.");

        player.play(filePath, function (err) {
          if (err) {
            console.error("Error playing the audio file:", err);
          } else {
            console.log("Audio playback successful");
          }
        });
      } else {
        console.error("The file was not found:", filePath);
      }
    }

    convertTextToMp3()
    res.status(200).send("Announcement made successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }

});
