#!/usr/bin/env node
// @ts-check

/** @type {import('axios').default} */
// @ts-ignore
const axios = require('axios')
/** @type {import('readline')} */
const readline = require('readline')

const PORT = process.env.PORT || 80
const url = `http://localhost:${PORT}`
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer
})

console.log(`\x1b[90mRequests will reach ${url}. To change the port, edit PORT env variable.\x1b[0m`)
console.log('Use \x1b[1mhelp\x1b[0m to see the available commands')

function completer (line) {
  const completions = 'help login request jwt'.split(' ')
  const hits = completions.filter((c) => c.startsWith(line))
  // Show all completions if none found
  return [hits.length ? hits : completions, line]
}

rl.on('line', (line) => {
  const [command, ...rest] = line.split(' ')
  const req = rest.join(' ')
  switch (command) {
    case 'login': login(req); break
    case 'req':
    case 'request':
      request(req)
      break
    case 'jwt': setJWT(req); break
    default: help(); break
  }
})

function help () {
  console.log(`\x1b[34mYou can use the following commands:
    - jwt: {string?} Set a jwt or remove it if empty
    - req: {string} Send a SimpleQL request
    - login: {string} Retrieve the jwt token from the next request and adds it to the next requests
    - help: This help message
    \x1b[0m`)
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
      setJWT(jwt)
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
  const correctJson = req.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ')
  const correctQuotes = correctJson.replace(/'([^\s,{[\]}]+)'/g, '"$1"')
  return axios.post(url, JSON.parse(correctQuotes))
}

/**
 * Send a SimplQL request to the endpoint
 * @param {object} req The simple-ql request
 * @returns {Promise<void>}
 */
async function request (req) {
  try {
    const result = await sendRequest(req)
    console.log(result.data)
  } catch (err) {
    /** @type {import('axios').AxiosError} **/
    const error = err
    if (!error.isAxiosError) logError(error.message)
    else logError(error.response.data)
  }
}

/**
 * Set the new value of the jwt token
 * @param {string?} jwt The jwt token or undefined to remove
 */
function setJWT (jwt) {
  try {
    jwt
      ? axios.defaults.headers.common.Authorization = 'Bearer ' + jwt
      : delete axios.defaults.headers.common.Authorization
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}

/**
 * Log an error message
 * @param {string} message The message to log
 */
function logError (message) {
  console.log('\x1b[31m', message, '\x1b[0m')
}

/**
 * Log a success message
 * @param {string} message The message to log
 */
function logSuccess (message) {
  console.log('\x1b[32m', message, '\x1b[0m')
}
