const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");

const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
const User = require("../../Models/User") 


// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
    // Form validation
  const { errors, isValid } = validateRegisterInput(req.body);
  console.log("errors",errors);
  // Check validation
    if (!isValid) {
        console.log("Inside condition Fail")
      return res.status(400).json(errors);
    }
  User.findOne({ employeeId: req.body.employeeId }).then(user => {
      if (user) {
        return res.status(400).json({ employeeId: "Employee Id already exists" });
      } else {
        const newUser = new User({
          name: req.body.name,
          userName: req.body.userName,
          employeeId: req.body.employeeId,
          password: req.body.password
        });
  // Hash password before saving in database
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          });
        });
      }
    });
  });

  // @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
    // Form validation
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const employeeId = req.body.employeeId;
    const password = req.body.password;
  // Find user by employeeId
    User.findOne({ employeeId }).then(user => {
      // Check if user exists
      if (!user) {
        return res.status(404).json({ employeeIdNotFound: "employeeId not found" });
      }
  // Check password
      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          // User matched
          // Create JWT Payload
          const payload = {
            id: user.id,
            name: user.name
          };
  // Sign token
          jwt.sign(
            payload,
            keys.secretOrKey,
            {
              expiresIn: 31556926 // 1 year in seconds
            },
            (err, token) => {
              res.json({
                success: true,
                token: "Bearer " + token
              });
            }
          );
        } else {
          return res
            .status(400)
            .json({ passwordincorrect: "Password incorrect" });
        }
      });
    });
  });

  router.get('/profile', (req, res) => {
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
    if (token.startsWith('Bearer ')) {
      // Remove Bearer from string
      token = token.slice(7, token.length);
      console.log(token)
    }
  
    if (token) {
      jwt.verify(token, keys.secretOrKey, (err, decoded) => {
        if (err) {
          return res.json({
            success: false,
            message: 'Token is not valid'
          });
        } else {
          req.decoded = decoded;
          console.log(decoded)
          let users = User.find({}, function(err, users){
            if(err){
                console.log(err);
            }
            else {
                res.json(users);
            }
        });
          
        }
      });
    } else {
      return res.json({
        success: false,
        message: 'Auth token is not supplied'
      });
    }
  });
  
  

  module.exports = router ;