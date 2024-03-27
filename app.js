const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')
let dataBase = null

const intializeDbandServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Servere running at http://localhost:300/')
    })
  } catch (e) {
    console.log(`Db error: ${e.message}`)
    peocess.exit(1)
  }
}

intializeDbandServer()

//get user list
app.get('/register/', async (request, response) => {
  const getallplayers = `
    SELECT * FROM user;`
  const result = await dataBase.all(getallplayers)
  response.send(result)
})
//create account
app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const checkingUserExistquery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await dataBase.get(checkingUserExistquery)
  if (dbUser === undefined) {
    const passwordlength = password.length
    if (passwordlength < 5) {
      response.status = 400
      response.send('Password is too short')
    } else {
      const createQuery = `INSERT INTO 
      user (username,name,password,gender,location) 
      VALUES 
      ('${username}','${name}','${hashedPassword}','${gender}','${location}')`
      await dataBase.run(createQuery)
      response.status = 200
      response.send('User created successfully')
    }
  } else {
    response.status = 400
    response.send('User already exists')
  }
})

//login user
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const checkingUserExistquery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await dataBase.get(checkingUserExistquery)
  if (dbUser === undefined) {
    response.status = 400
    response.send('Invalid user')
  } else {
    const ispasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (ispasswordMatched) {
      response.status = 200
      response.send('Login success!')
    } else {
      response.status = 400
      response.send('Invalid password')
    }
  }
})

//update password
app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkingUserExistquery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await dataBase.get(checkingUserExistquery)
  if (dbUser !== undefined) {
    const ispasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (ispasswordMatched) {
      const passwordlength = newPassword.length
      if (passwordlength < 5) {
        response.status = 400
        response.send('Password is too short')
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatepasswordQuery = `UPDATE user SET 
        password='${hashedPassword}' WHERE username='${username}';`
        await dataBase.run(updatepasswordQuery)
        response.status = 200
        response.send('Password updated')
      }
    } else {
      response.status = 400
      response.send('Invalid current password')
    }
  }
})

module.exports = app
