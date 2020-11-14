# Welcome to SimpleQL CLI

## Install

```
$ npm i --global simple-ql-cli
```

## API

 * **jwt** `{string?}` Set a jwt or remove it if empty
 * **request** `{string}` Send a SimpleQL request
 * **login** `{string}` Retrieve the jwt token from the next request
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

### Logout

```bash
jwt
```
