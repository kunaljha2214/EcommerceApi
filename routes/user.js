const express = require('express')
const router = express.Router()
const mailer = require('../utils/SendMail')

const User = require('../model/User')
const Auth = require('../model/Auth')

router.get('/signup',async (req, res, next)=>{
    const username = req.query.username
    const email = req.query.email
    const password = req.query.password

    let code = generateOTP()

    try{
        let user_exist = await User.findOne({'email': email});

        let checkUsername = await User.findOne({'username':username})
        if(checkUsername){
            res.status(404).json({
                success: false,
                message: "Username Already taken"
            }) 
        }

        if(user_exist){
            let checkAuth = await Auth.findOne({'email': email});
            if(checkAuth){
                res.status(404).json({
                    success: true,
                    message: "Email already used! enter otp"
                })
            }
            else{
                res.status(404).json({
                    success: false,
                    message: "email already used"
                })
            }
        
        }else{
            
                user = new User()
                user.username = username
                user.email = email
                user.password = password
              
                const authData  = new Auth({
                    email ,
                    code 
                })
                msg = mailer.mailer(email, code)
                if(msg){
                    return res.status(400).json({ success:false ,message : 'Cannot Send activation mail ! Check your email and try again'})
                }
 
                await user.save(async(err, response) => {
                    if(err) return res.status(400).json({ success: false, message: 'server destroy', error:err })
                    await authData.save((err, response) => {
                        if(err) return res.status(400).json({ success: false, message: 'server hang'})
                           return res.status(201).json({ success:true, message: 'otp send'})
                    })
                })  
            }
        }catch(err){
            console.log(err)
            res.status(500).json({
                success: false,
                message: 'server error'
            })
        }
    })

router.get('/login', async (req, res) => {
    const emailuser = req.query.emailuser
    const password = req.query.password

    let checkemailuser = await User.findOne({'email': emailuser})
    if(ValidateEmail(emailuser)){
      
       if(!checkemailuser) {
            res.status(201).json({
                success: false,
                message: 'email not found'
            })   
        }
    }else{
        checkemailuser = await User.findOne({'username': emailuser})
        if(!checkemailuser) {
            res.status(201).json({
                success: false,
                message: 'username not found'
            })
        }
    }
    if(checkemailuser){
        if(checkemailuser.password == password){
            res.status(200).json({
                success: true,
                message: 'successfully login'
            })
        }else{
            res.status(400).json({
                success: false,
                message: 'password incorrect'
            })
        }
    }
} )

function ValidateEmail(mail) 
     {
      if (/^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)$/.test(mail))
       {
         return (true)
       }
        
         return (false)
    }   

      

router.get('/verify/', async (req, res, next) => {
    const code = req.query.code
    const email = req.query.email

    console.log(email + "" + code)
    const acc = await Auth.findOne({ 'email': email })

   
    // console.log('Auth '+acc);
    if(acc == null){
        return res.status(400).json({success: false, message: 'ohho Email is not valid'})
    }
    if(!(acc.code == code)){
        return res.status(400).json({success: false, message: 'otp is incorrect'})
    }else{
        await Auth.findOneAndDelete({'email': email})
        await User.findOneAndUpdate({'email': email}, {'isVerified': true})
        return  res.status(201).json({success:true, message: 'Account is verified'})
    }
})

router.get('/changePassword/', async (req, res, next) => {
    const oldPassword = req.query.oldPassword
    const newPassword = req.query.newPassword
    const email = req.query.email

    const cp = await User.findOne({ 'email': email})
    if(!cp){
        return res.status(400).json({success: false, message: 'email not exist'})  
    }else{
        
        if(cp.password == oldPassword) {
            await User.findOneAndUpdate({'email': email}, {'password': newPassword})
            res.status(200).json({
                success: true,
                message: 'change password successfully'
            })
          
        }else{
            return res.status(400).json({success: false, message: 'old password not match'}) 
           
        }
    }
    
})

router.get('/changename/', async(req, res, next) => {
    const email = req.query.email
    const newusername = req.query.newusername

    const mailuser = await User.findOne({'email':email})
    if(mailuser){
        if(mailuser.username == newusername){
            res.status(400).json({
                success: false,
                message: 'please enter new name'
            })
        }else{
            
        let checkUsername = await User.findOne({'username':newusername})
        if(checkUsername){
            res.status(400).json({
                success: false,
                message: "Username Already taken"
            }) 
        }else{
            await User.findOneAndUpdate({'email': email}, {'username': newusername})
            res.status(200).json({
                success: true,
                message: 'change username successfully'
            })    
        }
        }
         
    }else{
        res.status(400).json({success: false, message: 'email not found'}) 
    }
})

router.get('/sendotp/', async(req, res, next) => {
    const email = req.query.email
    // const code1 = req.query.code
    const code = generateOTP()

    let sOtp = await User.findOne({'email': email})
    if(sOtp){
        const authData  = new Auth({
            email ,
            code 
        })
        msg = mailer.mailer(email, code)
        if(msg){
            return res.status(400).json({ success:false ,message : 'Cannot Send  mail ! Check your email and try again'})
        }

        await authData.save((err, response)=>{
            if(err) return res.status(400).json({ success: false, message: 'server hang'})
            return res.status(201).json({ success:true, message: 'otp send'})
        })
    }else{
        res.status(405).json({
            success: false,
            message: 'email not found'
        })
    }
})

router.get('/checkotp/', async(req, res, next) => {
    const email = req.query.email
    const code = req.query.code

    const checkOtp = await Auth.findOne({'email': email})

    if(checkOtp == null){
        res.status(200).json({success: false, message: 'email not found'})
    }
    if(!(checkOtp.code == code)){
        res.status(400).json({success: false, message: 'Otp is incorrect'})
    }else{
        res.status(200).json({
            success: true,
            message: 'Otp correct'
        })
    }
})

router.get('/forgetPassword/', async(req, res, next) => {
    const email = req.query.email
    const newPassword = req.query.newPassword
    

    const fp = await User.findOne({'email': email})
    // console.log(fp)

    if(!fp){
        res.status(400).json({success: false, message: 'email not exist'})
    }else{
        if(fp.password == newPassword){
            res.status(400).json({success: false, message: 'your password match with the old password'})
        }else{
            await User.findOneAndUpdate({'email': email}, {'password': newPassword})
            await Auth.findOneAndDelete({'email': email})
            res.status(200).json({
                success: true,
                message: 'new password created successfully'
            })            
        }
    }

})

router.get('/deleteaccount/', async(req, res, next) => {
    const email = req.query.email
    const password = req.query.password

    const deleteuser = await User.findOne({'email': email})

    if(!deleteuser){
        res.status(400).json({
            success: false,
            message: 'email not found'
        })
    }else{
        if(deleteuser.password == password){
            await User.findOneAndDelete({'email': email})
            return res.status(200).json({
                success: true,
                message: 'account deleted!'
            })
        }else{
            res.status(400).json({
                success: false,
                message: 'password incorrect'
            })
        }
            
    }    
})

router.get('/changemail/', async(req, res, next) => {
    const email = req.query.email
    const newemail = req.query.newemail

    const mail = await User.findOne({'email': email})

    if(!mail){
        res.status(400).json({success: false, message: 'email not exist'})
    }else{
        if((mail.email == newemail)) {
            // await User.findOneAndUpdate({'email': newemail})
            res.status(400).json({
                success: false,
                message: 'enter new email'
            })
          
        }else{
            
                let checkmail = await User.findOne({'email':newemail})
                if(checkmail){
                    res.status(400).json({
                        success: false,
                        message: "Email Already used in another account"
                    }) 
                }else{
                    await User.findOneAndUpdate({'email': newemail})
                    res.status(200).json({
                        success: true,
                        message: 'change email successfully'
                    })    
                }
                    
        }
    }
})

function generateOTP() {
    var  digits = '0123456789';
    let OTP = '';
    for (let i = 0; i<4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)]; 
    }
    return OTP;
}

module.exports = router
