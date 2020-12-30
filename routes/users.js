var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db= mongojs('passportapp', ['users']);
var bcrypt = require('bcryptjs');
var passport = require('passport');
var LocalStrategy = require('passport-local');




router.get('/login', function(req, res){
    res.render('login');
});

//Register
router.get('/register', function(req, res){
    res.render('register');
});

//Registre-Post
router.post('/register', function(req, res){
    //get Form Value
    var name= req.body.name;
    var email= req.body.email;
    var username=req.body.username;
    var password=req.body.password;
    var password2=req.body.password2;

    req.checkBody('name', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('username', 'Username field is required').notEmpty();
    req.checkBody('password', 'Password field is required').notEmpty();
    req.checkBody('password2', 'Password do not match').equals(req.body.password);

    var errors = req.validationErrors();
    if(errors){
        console.log('Form has errors');
        res.render('register',{
            errors: errors,
            name: name,
            email: email,
            username: username,
            password: password,
            password2: password2
        });
    }else{
        var newUser={
            name: name,
            email: email,
            username: username,
            password: password
        }
        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(newUser.password, salt, function(err, hash){
                newUser.password=hash;

                db.users.insert(newUser, function(err,doc){
                    if(err){
                        res.send(err);
                    }
                    else{
                        console.log('User Added...')
                        req.flash('success', ' log in now');
                        res.location('/');
                        res.redirect('/');
                    }
                })
            });
        });
    }
});

passport.serializeUser(function(user,done){
    done(null, user._id);
});

passport.deserializeUser(function(id,done){
   db.users.findOne({_id: mongojs.ObjectID(id)}, function(err, user){
       done(err, user);
   })
})

passport.use(new LocalStrategy(
    function(username, password, done){
        db.users.findOne({username: username}, function(err, user){
            if(err){
                return done(err);
            }
            if(!user){
                return done(null, false, {message: 'Incorret username'});

            }
            bcrypt.compare(password, user.password, function(err, match){
                if(err){
                    return done(err);
                }
                if(match){
                    return done(null, user);
                }
                else{
                    return done(null, false, {message: 'Incorret password'})
                }
            })
        })
    }
))
//login Post
router.post('/login',
    passport.authenticate('local', {
        successRedirect:'/',
        failureRedirect: '/users/login',
        failureFlash: 'Invalid Username or Password'}), function (req, res) {
            console.log('Auth Successfull');
            res.redirect('/'); 
        });

router.get('/logout', function(req,res) {
    req.logout();
    req.flash('success', 'You have logged out');
    res.redirect('/users/login');   
})

module.exports =router;