const mongoose = require("mongoose");

const connactionDB  = async () => {
try {

const connaction = await mongoose.connect(process.env.MONGODB_URI)
console.log(`Database Connected ${connaction.connection.host}`)

}catch(err){
    console.log(err)
    process.exit(1)
}
    
}

module.exports ={ connactionDB};