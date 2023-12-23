const mongoose = require('mongoose');
const bedSchema = new mongoose.Schema({
  wards:[
    {
      name: String,
      wardType:String,
      beds: [
        {

          number: String,
          status: String, // "available" or "occupied"
          patientName: String, // Add this field
          gender:String,
          age:Number,
          contactno:String,
          patientId:String,
          medicalAcuity: String,
          admissionDate:String,
          admissionTime:String,
          riskScore:String,
          //address:String,
          patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient', // Reference to your patient model
          },
          
        }]
    },
  ],
});

const Bed = mongoose.model('Wards', bedSchema);

module.exports = Bed;