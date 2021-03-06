const dotenv = require('dotenv')
const readline = require('readline')
const axios = require('axios')
const { JSDOM } = require('jsdom')
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1')
const fs = require('fs')
const { exec } = require("child_process")

dotenv.config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const begin = async () => {
  console.clear()
}

const verifyDependencies = async () => {
  if (!fs.existsSync('.env')) throw Error('Setup your .env file')
  if (!process.env.TEXT_TO_SPEACH_API_KEY) throw Error('Setup your IBM Cloud API Key for Watson text to speach API')
  if (!process.env.TEXT_TO_SPEACH_API_URL) throw Error('Setup your IBM Cloud API URL for Watson text to speach API')
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
      iam_apikey: process.env.TEXT_TO_SPEACH_API_KEY,
      url: process.env.TEXT_TO_SPEACH_API_URL
    })

    console.log('Generating audio from text...')

    textToSpeech.synthesize({
      text: joke,
      accept: 'audio/wav',
      voice: 'en-US_MichaelVoice'
    }, (error, audio) => {

      if (error) {
        reject(error)
      }

      console.log('Got audio from Watson')

      fs.writeFileSync('joke.wav', audio)

      console.log('joke.wav file was writed')

      resolve()

    })

  })

}

const sayJoke = () => {
  console.log('Executing joke.wav...')
  exec('start joke.wav')
}

const handleError = (error) => {
  console.log('An error has ocurred', error)
  process.exit()
}

begin()
  .then(verifyDependencies)
  .then(getSubject)
  .then(getJoke)
  .then(generateJokeAudio)
  .then(sayJoke)
  .catch(handleError)
