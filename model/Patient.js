const mongoose = require('mongoose')
const taskSchema = new mongoose.Schema({
  taskType: String,
  description: String,
});
const patientSchema = new mongoose.Schema({
  patientName: String,
  age:String,
  gender:String,
  contactno:String,
  patientId:String,
  wardId:String,
 // status:String,
  
wardName:{
  type:String,
  require:true

},
  bedNumber:{
    type:String,
},

  medicalAcuity:[{
    type:String,
    require:true

}],

admittingDoctors:[{
    type:String,
}],
admissionDate:String,
admissionTime:String,
address:[{
doorno:String,
streetname:String,
district:String,
state:String,
country:String,
pincode:String,

},
],
riskScore:String,
assignedNurse: String,
abhaNo:String,
tasks: [
  {
    taskType: String,
    description: String,
    //status: String, // "pending" or "completed"
  },
],
tasks: [taskSchema],
});
const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
