const mongoose = require('mongoose');
const WaitingListSchema=new mongoose.Schema(
    {
wards:[{
    type:String,
}],
number:[{
    type:String,
}],
bedType:[{
    type:String,
}],
patientName:String,
contactno:String,
medicalCondition: String,
abhaNumber:String,
aadharNumber:String,
priority:[{
    type:String,
    enum:[High,Low,Medium]
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
  
}],
    });
const Waiting=mongoose.Model("Waiting",WaitingListSchema);
module.exports=Waiting;