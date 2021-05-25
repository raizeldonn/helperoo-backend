const express = require('express')
const router = express.Router()
const Utils = require('./../utils')
const User = require('./../models/User')
const path = require('path')


// PUT - add favouriteCleaner --------------------------------------
router.put('/addFavCleaner/', Utils.authenticateToken, (req, res) => {  
  // validate check
  if(!req.body.userId){
    return res.status(400).json({
      message: "No cleaner specified"
    })
  }
  // add cleanerId to favouriteCleaners field (array - push)
  User.updateOne({
    _id: req.user._id
  }, {
    $push: {
      favouriteCleaners: req.body.userId
    }
  })
    .then((user) => {            
      res.json({
        message: "Cleaner added to favourites"
      })
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({
        message: "Problem adding favourite cleaner"
      })
    })
})

// GET - get single user -------------------------------------------------------
router.get('/:id', Utils.authenticateToken, (req, res) => {
  if(req.user._id != req.params.id){
    return res.status(401).json({
      message: "Not authorised"
    })
  }

  User.findById(req.params.id).populate('favouriteCleaners')
    .then(user => {
      res.json(user)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({
        message: "Couldn't get user",
        error: err
      })
    })
})

// GET- get all users---------------------------
router.get('/', Utils.authenticateToken, (req, res) => {
  //populate - if theres any fields that are references
  //then fill it with the whole document, but then the second
  //param says, only brin in thew three fields specified (dont wantr her pwd!!)
  //User.find().populate('user', '_id firstName lastName')
  User.find()
    .then(users => {
      if(users == null){
        return res.status(404).json({
          message: "No haircuts found"
        })
      }
      res.json(users)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({
        message: "Problem getting users"
      })
    })  
})

// PUT - update user ---------------------------------------------
router.put('/:id', Utils.authenticateToken, (req, res) => {
  // validate request
  if(!req.body) return res.status(400).send("Task content can't be empty")
  
  let avatarFilename = null

  // if avatar image exists, upload!
  if(req.files && req.files.avatar){
    // upload avater image then update user
    let uploadPath = path.join(__dirname, '..', 'public', 'images')
    Utils.uploadFile(req.files.avatar, uploadPath, (uniqueFilename) => {
      avatarFilename = uniqueFilename
      // update user with all fields including avatar
      updateUser({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        accessLevel: req.body.accessLevel,
        avatar: avatarFilename,  
        address: req.body.address ,
        price: req.body.price,
        rating: req.body.rating,
        speed: req.body.speed,
        thoroughness: req.body.thoroughness,
        pets: req.body.pets,
        policeCheck: req.body.policeCheck
      })
    })
  }else{
    // update user without avatar
    updateUser(req.body)
  }
  
  // update User
  function updateUser(update){    
    User.findByIdAndUpdate(req.params.id, update, {new: true})
    .then(user => res.json(user))
    .catch(err => {
      res.status(500).json({
        message: 'Problem updating user',
        error: err
      })
    }) 
  }
})

// POST - create new user --------------------------------------
router.post('/', (req, res) => {
  // validate request
  if(Object.keys(req.body).length === 0){   
    return res.status(400).send({message: "User content can not be empty"})
  }

  // check account with email doen't already exist
  User.findOne({email: req.body.email})
  .then(user => {
    if( user != null ){
      return res.status(400).json({
        message: "email already in use, use different email address"
      })
    }
  // create new user       
  let newUser = new User(req.body)
  newUser.save()
    .then(user => {        
      // success!  
      // return 201 status with user object
      return res.status(201).json(user)
    })
    .catch(err => {
      console.log(err)
      return res.status(500).send({
        message: "Problem creating account",
        error: err
      })
    })
  })
})

module.exports = router