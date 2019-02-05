#Express JS Notes
Documentation: https://expressjs.com/

## Initializing Express

```javascript
const express = require('express');
const app = express();
```

## Setting up a server

```javascript
//process.env.PORT is assigned when using heroku to deploy the app
const port = process.env.PORT || localhostport#
app.isten(port, success_callback)
```

## Using Middleware

```javascript
// if no route is provided, the middleware will be used globally
app.use('route(optional)', middlware);
```

Popular middleware includes:

- bodyParser
- passport

Example of using middleware in a route:
app.use('/api/user', User)
