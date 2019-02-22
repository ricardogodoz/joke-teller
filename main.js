require('dotenv').config()
const readline = require('readline')
const axios = require('axios')
const { JSDOM } = require('jsdom')
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1')
const fs = require('fs')
const {exec} = require("child_process")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const begin = async () => {
  console.clear()
}

const getSubject = () => {
  return new Promise((resolve) => {
    rl.question('Tell me a joke about ', (subject) => {
      rl.close()
      resolve(subject)
    })
  })
}

const getJoke = async (subject) => {

  console.log('Searching for jokes...')

  const response = await axios.get(`http://www.laughfactory.com/jokes/search/?kw=${subject}`)

  const dom = new JSDOM(response.data)

  const jokes = dom.window.document.getElementsByClassName('joke-text')

  if (jokes.length == 0) throw Error(`Coundn't find any joke about ${subject}`)

  let joke = jokes[0].textContent.trim()

  console.log('Joke found:', joke.substr(0, 10) + '...')

  return joke

}

const generateJokeAudio = (joke) => {

  return new Promise((resolve) => {

    var textToSpeech = new TextToSpeechV1({
      iam_apikey: process.env.SERVICE_NAME_API_KEY,
      url: process.env.SERVICE_NAME_URL
    });

    console.log('Generating audio from text...')

    textToSpeech.synthesize({
      text: joke,
      accept: 'audio/mp3',
      voice: 'en-US_AllisonVoice'
    }, (error, audio) => {

      if (error) {
        reject(error)
      }

      console.log('Got audio from Watson')

      fs.writeFileSync('joke.mp3', audio)

      console.log('joke.mp3 file was writed')

      resolve()

    })

  })

}

const sayJoke = () => {
  console.log('Executing joke.mp3...')
  exec('start joke.mp3')
}

const handleError = (error) => {
  console.log('An error has ocurred', error)
}

begin()
  .then(getSubject)
  .then(getJoke)
  .then(generateJokeAudio)
  .then(sayJoke)
  .catch(handleError)
