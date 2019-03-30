var dateFormat      = require('dateformat');
var formidable      = require('formidable');
var fs              = require('fs');
var mv              = require('mv');
var Cryptr          = require('cryptr'),
cryptr              = new Cryptr('1234567890');


exports.registration = function(req, res) {

    var baseUrl = req.protocol + '://' + req.headers['host'];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {

        if(err){

            res.json({status: "fail",message: err});
            return;

        }

        if (fields.username == '') {

            res.json({status: "fail",message: 'user name is required'});
            return;

        }

        if (fields.password == '') {

            res.json({status: "fail",message: 'password is required'});
            return;

        }

        if (fields.email == '') {

            res.json({status: "fail",message: 'email is required'});
            return;

        }

        connection.query("SELECT * from users WHERE username = '"+fields.username+"'", function(err, user) {

            
            if (err) throw err;
            if (user.length) {
                return res.json({ status: "fail", message: 'Username already registered'});
            }

            var profileImage = "";
            if (files.profileImage) {

                var oldpath = files.profileImage.path;
                var profileImage = "profile"+Date.now() + ".jpg";
                var newpath = './public/uploads/profile/' + profileImage;
                mv(oldpath, newpath, function(err) {
                    if (err) throw err;
                });
            } 

                email = fields.email;
                username = fields.username;
                var newUser = {

                    username        : fields.username,
                    email           : fields.email,
                    profileImage    : profileImage
                };
                newUser. password = cryptr.encrypt(fields.password);
                newUser.token = cryptr.encrypt(Math.random(0,9));

               // let sql = "INSERT INTO users(username,email,profileImage,password,token) VALUES ('"+username+"','"+email+"','"+profileImage+"','"+password+"','"+token+"')";
                connection.query("INSERT INTO users set ?",newUser, function(err, user) {

                    if (err) {
                        res.json({ status: "fail", message: 'User could not be registered. PLease send all the required info and try again'});
                        return;
                    } else {

                        newUser.id = user.insertId;

                        if (newUser.profileImage)
                            newUser.profileImage = baseUrl+"/uploads/profile/" + newUser.profileImage;

                        res.json({'status':'success',data:newUser});
                        return;

                    }

                });
          
        });
    });
}

exports.userLogin = function(req, res) {

    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {

        let baseUrl         =   req.protocol + '://'+req.headers['host'];
        let username        =   fields.username;
        let password        =   fields.password;

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);
        
        if (username == '') {

            res.json({status: "fail",message: 'user name is required'});
            return;

        } else if (password == '') {

            res.json({status: "fail",message: 'Password is required'});
            return;

        }

        connection.query("SELECT * from users WHERE username = '"+username+"'", function(err, user) {

            user = user[0];

            if (err) {
                res.status(500);
                res.json({ status: "fail",  message: err});
                return;

            } else if (!user) {

                res.json({status: "fail", message: 'Please enter valid username.'});
                return;

            } else if (cryptr.decrypt(user.password)!=password) {

                res.json({status: "fail",message: 'Please enter valid password.' });
                return;

            }else {

                test = cryptr.encrypt(Math.random(0,9));

                connection.query("UPDATE users SET authToken = '"+test+"' WHERE id = '"+user.id+"'", function(err, result) {

                    user.authToken      =   test;
           
                    if (user.profileImage)
                        user.profileImage = baseUrl+"/uploads/profile/"+user.profileImage;

                    res.json({ status: "success", message: 'User authentication successfully done!', data: user});
                    return;
                });
            }

        });
    });
}
