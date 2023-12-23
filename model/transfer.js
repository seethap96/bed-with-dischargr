const mongoose = require('mongoose');

const transfersSchema = new mongoose.Schema({
  patientName: String,
  age:String,
  gender:String,
  contactno:String,
  patientId:String,
 
currentWard:{
    type:String,
},
currentBedNumber:{
    type:String,
},

transferWard:{
    type:String
},

transferBedNumber:{
    type:String
},
currentdept:[{
    type:String
}],
transferdept:[{
    type:String
}],
medicalAcuity:[{
    type:String
}],

transferReasons:[{
    type:String
}],
 //transferDate:String,
//transferTime:String,


});

const Transfers = mongoose.model('Transfers', transfersSchema);

module.exports = Transfers;

