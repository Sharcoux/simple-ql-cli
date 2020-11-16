# Welcome to SimpleQL CLI

## Install

```
$ npm i --global simple-ql-cli
```

## API

 * **jwt** `{string?}` Set a jwt token to log a user
 * **request** `{string}` Send a SimpleQL request
 * **login** `{string}` Retrieve the jwt token from the next request
 * **logout** Remove the previous jwt token, logging out the user.
 * **admin** `{string}` Log as admin with the database private key. Needs to be executed within the server project folder to access private.key
 * **help** Display the available commands

## Examples

### Login

This will create and log a user in

```bash
$ simpleql
> login { Client: { email: 'user1@gmail.com', password: 'test', create: true } }
```

### Retrieve data

```bash
request { Client: { get: '*' }}
```

### Admin request

To make requests with admin rights, you will need to execute the following command within the server folder, or copy locally the file `private.key` that you will find in that folder. You also need to provide the value provided as `database.privateKey` to the SimpleQL server.

```bash
admin <privateKey>
```

All subsequent requests will be made with admin rights, until you close the CLI or until you call `logout`

### Logout

```bash
logout
```
