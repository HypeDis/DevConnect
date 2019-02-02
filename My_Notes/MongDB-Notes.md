# MongoDB Notes

Documentation: https://mongoosejs.com/docs/

## Initializing the db through mongoose:

```javascript
// located in server.js
mongoose .connect(‘db_URI’, {options}) // use {userNewUrlParser: true} as option to remove deprecation warning
  .then(callback()) //
  .catch(callback(err)) // if an error occurs
```

## Creating a new model:

- Create the schema for the model <br>
- Save the model in a collection <br>

<em>The model file is always singular and uppercase</em>

Example: User.js

```javascript
const mongoose = require(‘mongoose’)
const Schema = mongoose.Schema

// create a schema for the model
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// create the model and export the model
module.exports = User = mongoose.model("users", UserSchema);  //mongoose.model('collection', schemaName)
```

## Creating a new document:

```javascript
// create the document
const newDocument = new Model({ data });
// save the document to the db
newDocument
  .save()
  .then(callback(document))
  .catch(callback(err));
```

Example: <br>
  Description: Register a new user <br>
  Route: POST to /api/user/register <br>
  File location: ./routes/api/users.js <br>

```javascript
User.findOne({ email: req.body.email }).then(user => {
  //check if user already exists
  if (user) {
    errors.email = 'Email already exists';
    return res.status(400).json({ errors });
  } else {
    // grab avatar of that email
    const avatar = gravatar.url(req.body.email, {
      s: 200, // size
      r: 'pg', // rating
      d: 'mm', // default image
    });
    // create a new user document from provided data
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      avatar,
      password: req.body.password,
    });
    // hash the password
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        // save the new user to the db once password is finished hashing
        newUser
          .save()
          .then(user => res.json(user))
          .catch(err => console.log(err));
      });
    });
  }
});
```

## Other useful methods

Find a document

```javascript
Model.findById(id, 'field1 field2 ...', callback(err, document));
Model.findOne({ field: value }, callback(document));
```

Remove a document

```javascript
Model.findByIdAndRemove(id).then(callback);
Model.findOneAndRemove({ field: value }).then(callback);
```

Populate a document with data from another document

```javascript
document.populate('otherdocument', data); //insert data from another document
```

Example: <br>
  Description: Add avatar and name when retrieving profile info <br>
  Route: GET to api/profile route <br>
  File location: ./routes/api/profile.js <br>

```javascript
//grab the profile  associated with the user returned by jwt.authenticate()
Profile.findOne({ user: req.user.id });
```

In order to use populate(), the schema of the document must reference another collection <a href="#fn1">[1]</a>

```javascript
  .populate('user', ['name', 'avatar'])
  //'user' is a field in the profile document.
  //name and avatar are grabbed from the reference document. in this case the reference is to the 'users' collection.
  // populate will match the 'user' fields _id with the matching _id in the 'users' collection
  .then(profile => {
    if (!profile) {
      errors.noprofile = 'There is no profile for this user';
      return res.status(404).json(errors);
    }
    res.json(profile);
  })
  .catch(err => res.status(404).json(errors));
```

<p id="fn1"> <a href="#fn1">[1]</a> Snippet from Profile schema that contains a reference</p>

```javascript
user: { // the user field in the profile document. the id must match the id of the user document
        type: Schema.Types.ObjectId,
        ref: 'users', // reference to the 'users' collection
      }
```
