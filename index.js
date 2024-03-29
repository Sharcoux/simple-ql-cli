#!/usr/bin/env node
// @ts-check

/** @type {import('axios').default} */
// @ts-ignore
const axios = require('axios')
/** @type {import('readline')} */
const readline = require('readline')

const URL = process.env.URL || 'http://localhost'
const PORT = process.env.PORT || 80
const [protocol, , domain, ...pathParts] = URL.split('/')
const path = pathParts.join('/')
const url = `${protocol}//${domain}:${PORT}/${path}`
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer
})

console.log(`\x1b[90mRequests will reach ${url}.
  To change the port, edit PORT env variable.
  To change the url, edit the URL env variable.
  Example: export URL=https://website.com\x1b[0m
`)
console.log('Use \x1b[1mhelp\x1b[0m to see the available commands')

function completer (line) {
  const completions = 'help login request jwt logout admin'.split(' ')
  const hits = completions.filter((c) => c.startsWith(line))
  // Show all completions if none found
  return [hits.length ? hits : completions, line]
}

rl.on('line', (line) => {
  const [command, ...rest] = line.split(' ')
  const req = rest.join(' ')
  switch (command) {
    case 'login': login(req); break
    case 'logout': logout(); break
    case 'admin': admin(req); break
    case 'req':
    case 'request': request(req); break
    case 'jwt': setJWT(req); break
    default: help(); break
  }
})

/** Hust display details on the API */
function help () {
  console.log(`\x1b[34mYou can use the following commands:
    - jwt: {string} Set a jwt token to log a user
    - request: {string} Send a SimpleQL request
    - login: {string} Retrieve the jwt token from the next request and adds it to the next requests
    - logout: Remove the previous jwt token, logging out the user.
    - admin: {string} Log as admin with the database private key. Needs to be executed within the server project folder to access private.key
    - help: This help message
    \x1b[0m`)
}

/**
 * Log as admin to the SimpleQL database. Subsequent request will have admin rights until the next call to logout
 * @param {string} databaseKey The value of database.privateKey provided to SimpleQL
 */
async function admin (databaseKey) {
  console.log(`The value: '${databaseKey}' that you provided should be the same as the value of database.privateKey provided to SimpleQL.`)
  try {
    /** @type {import('jsonwebtoken')} */
    const jwt = require('jsonwebtoken')
    /** @type {import('fs')} */
    const fs = require('fs')
    const privateKey = fs.readFileSync('private.key')
    const token = jwt.sign({ id: databaseKey }, privateKey, { algorithm: 'RS256', expiresIn: '2 days' })
    setJWT(token)
  } catch (err) {
    if (err.code === 'ENOENT:') logError('You need to execute this command in the root folder of the SimpleQL server, where lies the file private.key, or download it.')
    else logError(err.message)
  }
}

/**
 * Send a request and retrieve the jwt token from it
 * @param {string} req The login request. Should look like { User: { login: 'test', password: 'test' }}
 */
async function login (req) {
  try {
    const response = await sendRequest(req)
    const result = response.data
    const tableName = Object.keys(result).find(table => Array.isArray(result[table]) && result[table].length && result[table][0].jwt)

    if (!tableName) {
      logError(`We couldn't find the jwt after login. Maybe the request failed. Here is the results: ${JSON.stringify(result, null, 4)}`)
    } else {
      const { jwt, reservedId } = result[tableName][0]
      axios.defaults.headers.common.Authorization = 'Bearer ' + jwt
      logSuccess(`User ${reservedId} got logged in.`)
    }
  } catch (err) {
    /** @type {import('axios').AxiosError} **/
    const error = err
    if (!error.isAxiosError) logError(error.message)
    else logError(error.response.data)
  }
}

/**
 * Send the request to the endpoint
 * @param {object} req The simple-ql request
 * @returns {Promise<import('axios').AxiosResponse>}
 */
function sendRequest (req) {
  // eslint-disable-next-line no-eval
  const json = typeof req === 'string' ? eval('(' + req + ')') : req
  return axios.post(url, json)
}

/**
 * Send a SimplQL request to the endpoint
 * @param {object} req The simple-ql request
 * @returns {Promise<Object>}
 */
async function request (req) {
  try {
    const result = await sendRequest(req)
    console.log(result.data)
    return result.data
  } catch (err) {
    /** @type {import('axios').AxiosError} **/
    const error = err
    if (!error.response) logError(error.message)
    else logError(error.response.data)
  }
}

/**
 * Set the new value of the jwt token
 * @param {string?} jwt The jwt token or undefined to remove
 */
function setJWT (jwt) {
  if (!jwt) logError('No jwt token provided.')
  else {
    axios.defaults.headers.common.Authorization = 'Bearer ' + jwt
    logSuccess('jwt token succesfully applied.')
  }
}

/** Log the previous user out. */
function logout () {
  delete axios.defaults.headers.common.Authorization
  logSuccess('The user got logged out.')
}

/**
 * Log an error message
 * @param {string} message The message to log
 */
function logError (message) {
  console.log('\x1b[31m' + message + '\x1b[0m')
}

/**
 * Log a success message
 * @param {string} message The message to log
 */
function logSuccess (message) {
  console.log('\x1b[32m' + message + '\x1b[0m')
}

module.exports = {
  admin,
  login,
  request,
  logout
}
