const mongoose=require('mongoose');

const dischargeSchema=new mongoose.Schema({
  
patientName: String,
        age:String,
        gender:String,
        //contactno:String,
        patientId:String,
       admissionDate:String,
        dischargeDate: String,
        
       
        wards:{
            type:String,
            require:true
        },
        
          number:{
            type:String,
        },
        
          medicalAcuity:[{
            type:String,
            require:true
        
        }],
        dischargeReasons:
        [{ type:String,
           require:true}],

        
})
const Discharged=mongoose.model('Discharge',dischargeSchema);
module.exports=Discharged;