const GetUserData =("/", (req,res) => {
    res.status(200).json({message:"User Data"})
})
module.exports = {GetUserData}