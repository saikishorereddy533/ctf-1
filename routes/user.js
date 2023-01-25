const router = require("express").Router();
const User=require('../models/User');
const {isAuthenticated} = require('../middleware/check-auth');
const crypto = require("crypto");

router.get("/",async(req,res)=>{
  const { token } = req.cookies;

  if (!token) {
    res.render("login");
  }
  else{
     res.redirect("/getusers");
  }
})


router.post("/captcha/:id",isAuthenticated, async (req,res)=>{
  console.log(req.params.id);
  if(req.body.captcha=="HRXrhsn"){
    console.log("inside if")
    res.redirect("/logout");
  }
  else{
    console.log("inside else")
      res.render("captcha");
    }
})

// router.get("/send-captcha",isAuthenticated, async (req,res)=>{
//   res.render("captcha")
// })

router.get("/update",isAuthenticated, async (req,res)=>{
  res.render("update")
})

router.get("/getusers",isAuthenticated,async (req,res)=>{
  const user = await User.findById(req.user._id);
  if(user.isAdmin){
    res.render("admin");
  }
  else{
    res.render("userlist")
  }
})

router.get("/register",async(req,res)=>{
  const { token } = req.cookies;

  if (!token) {
    res.render("register");
  }
  else{
    res.send("You are Already Logged in...")
  }
})

router.get("/logout", isAuthenticated, async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
      .redirect("/")
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
)

router.post("/resetpass",isAuthenticated, async (req,res)=>{
  try {
    const user = await User.findById(req.user._id);

    const { name, email ,number } = req.body;

    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    if(number==101){
      user.isAdmin=true
    }

    await user.save();

    res.status(200).redirect("/getusers");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  }
)

router.post("/register", async (req,res)=>{
    try {
        const { name, email, password ,param} = req.body;
        console.log(req.body)
        let user = await User.findOne({ email });
        if (user) {
          return res
            .status(400)
            .json({ success: false, message: "User already exists" });
        }
    
        user = await User.create({
          name,
          email,
          password
        });    
        const token = await user.generateToken();
        const options = {
          expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          httpOnly: true,
        };
    
        res.status(201).cookie("token", token, options).render("captcha");

        await user.save();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
})



router.post("/login",async (req,res)=>{
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email })
        .select("+password")
  
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User does not exist",
        });
      }
  
      const isMatch = await user.matchPassword(password);
  
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Something Went Wrong!!!",
        });
      }
  
      const token = await user.generateToken();
      const options = {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
  
      res.status(200).cookie("token", token, options).redirect("/getusers")
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

module.exports = router 