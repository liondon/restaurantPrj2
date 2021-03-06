const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Restaurant = db.Restaurant

// set up local authentication strategy
passport.use(new LocalStrategy(
  // customize user field
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  // authenticate user
  (req, username, password, cb) => {
    User.findOne({ where: { email: username } })
      .then(user => {
        if (!user) {
          return cb(null, false,
            req.flash('error_msg', 'This email has NOT registered!'));
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return cb(null, false,
            req.flash('error_msg', 'Email or Password incorrect!'));
        }
        return cb(null, user);
      })
      .catch(err => {
        return cb(err)
      })
  }
))

// set up serialize and deserialize 
// to store userID instead of whole user obj in session
passport.serializeUser((user, cb) => {
  cb(null, user.id)
})
passport.deserializeUser((id, cb) => {
  User.findByPk(id, {
    include: [{
      model: Restaurant,
      as: 'FavoriteRestaurants'
    }, {
      model: Restaurant,
      as: 'LikeRestaurants'
    }, {
      model: User,
      as: 'Followers'
    }, {
      model: User,
      as: 'Followings'
    }]
  })
    .then(user => {
      user = user.toJSON()
      return cb(null, user)
    })
})

// JWT strategy for Web API server
const jwt = require('jsonwebtoken')
const passportJWT = require('passport-jwt')
const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

let jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
jwtOptions.secretOrKey = process.env.JWT_SECRET

let strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  User.findByPk(jwt_payload.id, {
    include: [
      { model: db.Restaurant, as: 'FavoriteRestaurants' },
      { model: db.Restaurant, as: 'LikeRestaurants' },
      { model: User, as: 'Followers' },
      { model: User, as: 'Followings' }
    ]
  }).then(user => {
    if (!user) {
      return next(null, false)
    }
    return next(null, user)
  })
})
passport.use(strategy)

module.exports = passport