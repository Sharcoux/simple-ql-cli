#!/usr/bin/env node
// @ts-check

/** @type {import('axios').default} */
// @ts-ignore
const axios = require('axios')

const PORT = process.env.PORT || 80
const url = `http://localhost:${PORT}`

console.log(`Requests will reach ${url}. To change the port, edit PORT env variable.`)

// eslint-disable-next-line no-unused-vars
const [node, file, command, parameter] = process.argv

switch (command) {
  case 'login': login(parameter); break
  case 'req':
  case 'request':
    request(parameter)
    break
  case 'jwt': setJWT(parameter); break
  default: help(); break
}

function help () {
  console.log(`You can use the following commands:
    - jwt: {string?} Set a jwt or remove it if empty
    - req: {string} Send a SimpleQL request
    - login: {string} Retrieve the jwt token from the next request
    - help: This help message
  `)
}

/**
 * Send a request and retrieve the jwt token from it
 * @param {string} req The login request. Should look like { User: { login: 'test', password: 'test' }}
 */
function login (req) {
  return request(req).then(res => {
    const result = res.data
    const tableName = Object.keys(result).find(table => Array.isArray(table) && table.length && table[0].jwt)
    if (!tableName) {
      console.log(`We couldn't find the jwt after login. Maybe the request failed. Here is the results: ${JSON.stringify(result, null, 4)}`)
    } else {
      const { jwt, reservedId } = result[tableName].jwt
      setJWT(jwt)
      console.log(`User ${reservedId} got logged in.`)
    }
  })
}

/**
 * Send the request to the endpoint
 * @param {object} req The simple-ql request
 * @returns {Promise<import('axios').AxiosResponse>}
 */
function request (req) {
  return axios.post(url, req)
}

/**
 * Set the new value of the jwt token
 * @param {string?} jwt The jwt token or undefined to remove
 */
function setJWT (jwt) {
  jwt
    ? (axios.defaults.headers.common.Authorization = 'Bearer ' + jwt)
    : delete axios.defaults.headers.common.Authorization
}
