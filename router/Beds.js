//Import for both patient and bed in router
const express = require('express');
//const app = express();
const router = express.Router();
const moment = require('moment');


const Bed =  require('../model/Beda');
const Patient = require('../model/Patient');
const Transfer=require('../model/transfer');
const Discharged=require('../model/discharge');
const { model } = require('mongoose');


//addward:
// POST to add beds to an existing ward

router.post('/add-ward-and-beds', async (req, res) => {
  try {
    const { wardName, wardType } = req.body;

    // Find the existing ward by its name and wardType
    let existingWard = await Bed.findOne({
      'wards.name': wardName,
      'wards.wardType': wardType,
    });

    // If the ward doesn't exist, create a new one
    if (!existingWard) {
      existingWard = new Bed();
      existingWard.wards.push({
        name: wardName,
        wardType: wardType,
        beds: [],
      });
    }

    // Add 10 beds to the existing or new ward
    for (let i = 1; i <= 10; i++) {
      const newBed = {
        number: `Bed ${i}`,
        status: 'available',
      };
      existingWard.wards[0].beds.push(newBed);
    }

    // Save the updated or newly created ward
    await existingWard.save();

    res.status(200).json({ message: 'Added 10 extra beds to the specified ward successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add beds to the ward' });
  }
});

  
// GET all wards and beds
router.get('/all-wards-and-beds', async (req, res) => {
  try {
    const allWardsAndBeds = await Bed.find();

    res.status(200).json(allWardsAndBeds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch wards and beds.' });
  }
});


//landing pagge for bed:(doubt)
// Assuming you have your Bed model defined and other necessary setup

// Update a specific bed by ID
router.put('/beds/:bedId', async (req, res) => {
  const { bedId } = req.params;
  const updatedData = req.body;

  try {
    // Find the bed by its unique identifier (bedId)
    const bed = await Bed.findById(bedId);

    if (!bed) {
      return res.status(404).json({ error: 'Bed not found.' });
    }

    // Update bed information
    if (updatedData.hasOwnProperty('wards')) {
      bed.wards = updatedData.wards;
    }

    if (updatedData.hasOwnProperty('beds')) {
      bed.beds = updatedData.beds;
    }

    // Save the updated bed data
    await bed.save();

    res.json({ message: 'Bed information updated successfully.' });
  } catch (error) {
    console.error('Error updating bed information:', error);
    res.status(500).json({ error: 'Error updating bed information.' });
  }
});


//admit patient ://latest
let patientCounter = 0; // Initialize the counter

function generatePatientID() {
  patientCounter++; // Increment the counter
  const formattedCounter = String(patientCounter).padStart(3, '0'); // Format the counter as "001," "002," etc.
  return `PAT${formattedCounter}`;
}

// Function to calculate the risk score based on medical acuity
function calculateRiskScore(medicalAcuity) {
  switch (medicalAcuity) {
    case "Critical":
      return 0.85;
    case "Moderate":
      return 0.65;
    case "Stable":
      return 0.45;
    default:
      return 0.1; // Default risk score for unknown or unassigned medical acuity
  }
}

router.post('/admitpt', async (req, res) => {
  const {
    patientName,
    age,
    gender,
    contactno,
    wards,
    number,
    medicalAcuity,
    admittingDoctors,
    admissionDate,
    admissionTime,
    assignedNurse,
    tasks,
    address,
    abhaNo,
  } = req.body;

  try {
    // Automatically generate a patient ID
    const patientId = generatePatientID();

    // Calculate the risk score based on medical acuity
    const riskScore = calculateRiskScore(medicalAcuity);

    // Check if the specified ward exists
    const bedData = await Bed.findOne({ 'wards.name': wards });
    if (!bedData) {
      return res.status(400).json({ error: 'Ward does not exist.' });
    }

    // Check if the specified bed exists in the ward
    const wardData = bedData.wards.find((wardItem) => wardItem.name === wards);
    const bed = wardData.beds.find((bedItem) => bedItem.number === number);

    if (!bed) {
      return res.status(400).json({ error: 'Bed does not exist in the selected ward.' });
    }

    // Check if the bed is available
    if (bed.status === 'occupied') {
      return res.status(400).json({ error: 'Selected bed is already occupied.' });
    }

    // Create a new Patient document and save it
    const newPatient = new Patient({
      patientName,
      age,
      gender,
      contactno,
      patientId,
      wards,
      number,
      medicalAcuity,
      admittingDoctors,
      admissionDate,
      admissionTime,
      assignedNurse,
      tasks,
      address,
      abhaNo,
      riskScore,
    });

    const savedPatient = await newPatient.save();

    // Mark the bed as occupied in the bed collection
    bed.status = 'occupied';
    bed.patientName = patientName;
    bed.medicalAcuity = medicalAcuity;
    bed.age = age;
    bed.gender = gender;
    bed.patientId = patientId;
    //bed.contactno = contactno;
   // bed.admissionDate = admissionDate;
    //bed.admissionTime = admissionTime;
    //bed.riskScore = riskScore;

    // Save changes to the bed data
    await bedData.save();

    res.status(201).json(savedPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;




//get method of bed availability:
router.get('/bee', async (req, res) => {
  try {
    const availableBeds = await Bed.find();
    res.json(availableBeds);
  } catch (error) {
    res.json(error);
  }
});





//landing page for admit patient:
router.put('/update/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const updatedData = req.body;

  try {
    // Find the patient by patientId
    const patient = await Patient.findOne({ patientId });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // Update patient information
    if (updatedData.hasOwnProperty('name')) {
      patient.name = updatedData.name;
    }

    if (updatedData.hasOwnProperty('age')) {
      patient.age = updatedData.age;
    }

    if (updatedData.hasOwnProperty('gender')) {
      patient.gender = updatedData.gender;
    }

    if (updatedData.hasOwnProperty('contactno')) {
      patient.contactno = updatedData.contactno;
    }

    if (updatedData.hasOwnProperty('medicalAcuity')) {
      patient.medicalAcuity = updatedData.medicalAcuity;
    }

    // Save the updated patient data
    await patient.save();

    // Update patient information in the Bed model
    const bedsToUpdate = await Bed.find({ 'wards.beds.patientId': patientId });

    for (const bed of bedsToUpdate) {
      for (const ward of bed.wards) {
        for (const bedInfo of ward.beds) {
          if (bedInfo.patientId === patientId) {
            if (updatedData.hasOwnProperty('name')) {
              bedInfo.patientName = updatedData.name;
            }

            if (updatedData.hasOwnProperty('age')) {
              bedInfo.age = updatedData.age;
            }

            if (updatedData.hasOwnProperty('gender')) {
              bedInfo.gender = updatedData.gender;
            }

            if (updatedData.hasOwnProperty('contactno')) {
              bedInfo.contactno = updatedData.contactno;
            }

            if (updatedData.hasOwnProperty('medicalAcuity')) {
              bedInfo.medicalAcuity = updatedData.medicalAcuity;
            }
          }
        }
      }
      await bed.save();
    }

    res.json({ message: 'Patient information updated successfully.' });
  } catch (error) {
    console.error('Error updating patient information:', error);
    res.status(500).json({ error: 'Error updating patient information.' });
  }
});
//remove:
router.delete('/admit/:patientId', async (req, res) => {
  const { patientId } = req.params;

  try {
    // Find and delete the patient from the Patient model
    const deleteResult = await Patient.deleteOne({ patientId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // Update the patient's details in the Bed model
    const beds = await Bed.find({ 'wards.beds.patientId': patientId });

    if (beds && beds.length > 0) {
      for (const bed of beds) {
        for (const ward of bed.wards) {
          const bedIndex = ward.beds.findIndex((bedInfo) => bedInfo.patientId === patientId);

          if (bedIndex !== -1) {
            // Clear patient details in the bed record
            const selectedBed = ward.beds[bedIndex];
            selectedBed.status = 'available';
            selectedBed.patientName = '';
            selectedBed.gender = '';
            selectedBed.age = '';
            selectedBed.contactno = '';
            selectedBed.patientId = '';
            selectedBed.medicalAcuity = '';
            selectedBed.address = '';
            selectedBed.admissionDate = '';
          }
        }
        await bed.save();
      }
    }

    res.json({ message: 'Patient admitted data deleted successfully.' });
  } catch (error) {
    console.error('Error deleting admitted patient data:', error);
    res.status(500).json({ error: 'Error deleting admitted patient data.' });
  }
});


//configuration of  medical Acuity screen:

router.put('/updateMedicalAcuity/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const { newMedicalAcuity } = req.body; // Specify the new medical acuity

  try {
    // Find the patient by patientId
    const patient = await Patient.findOne({ patientId });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // Get the current medical acuity
    const currentMedicalAcuity = patient.medicalAcuity;

    // Update the medical acuity in the patient record
    patient.medicalAcuity = newMedicalAcuity;

    // Save the updated patient data
    await patient.save();

    // Update the medical acuity in the corresponding bed record(s)
    const bedsToUpdate = await Bed.find({ 'wards.beds.patientId': patientId });

    for (const bed of bedsToUpdate) {
      for (const ward of bed.wards) {
        for (const bedInfo of ward.beds) {
          if (bedInfo.patientId === patientId) {
            bedInfo.medicalAcuity = newMedicalAcuity;
          }
        }
      }
      await bed.save();
    }

    res.json({
      message: 'Medical acuity updated successfully.',
      currentMedicalAcuity, // Include the correct current medical acuity
      newMedicalAcuity,
    });
  } catch (error) {
    console.error('Error updating medical acuity:', error);
    res.status(500).json({ error: 'Error updating medical acuity.' });
  }
});
//Showing all the details of patient with group of medical Acuity(filter)
router.get('/medicfit', async (req, res) => {
  try {
    // Retrieve distinct medical acuity levels from the patients
    const distinctAcuityLevels = await Patient.distinct('medicalAcuity');

    // Create an object to store patients for each acuity level
    const medicalAcuityWithPatients = {};

    // Iterate through distinct acuity levels and find patients for each
    for (const acuityLevel of distinctAcuityLevels) {
      const patients = await Patient.find({ medicalAcuity: acuityLevel });
      medicalAcuityWithPatients[acuityLevel] = patients;
    }

    res.json(medicalAcuityWithPatients);
  } catch (error) {
    console.error('Error retrieving medical acuity with patients:', error);
    res.status(500).json({ error: 'Error retrieving medical acuity with patients.' });
  }
});

//showing only patient name with group of medical Acuity
router.get('/medics', async (req, res) => {
  try {
    const patients = await Patient.find();

    // Create an object to categorize patients by medical acuity
    const medicalAcuityCategories = {};

    // Iterate through all patients and categorize them by medical acuity
    patients.forEach(patient => {
      const acuityLevel = patient.medicalAcuity;

      if (!medicalAcuityCategories[acuityLevel]) {
        medicalAcuityCategories[acuityLevel] = [];
      }

      medicalAcuityCategories[acuityLevel].push(patient.name);
    });

    res.json(medicalAcuityCategories);
  } catch (error) {
    console.error('Error retrieving medical acuity with patients:', error);
    res.status(500).json({ error: 'Error retrieving medical acuity with patients.' });
  }
});




// get admit:


router.get('/aff', async (req, res) => {
  try {
    const pat1 = await Patient.find();
    res.json(pat1);
  } catch (error) {
    res.json(error);
  }
});



module.exports = router;
//Transfer code:



router.post('/bedaction', async (req, res) => {
  const {
    currentWard,
    currentBedNumber,
    patientName,
    age,
    gender,
    contactno,
    patientId,
    transferWard,
    transferBedNumber,
    currentdept,
    transferdept,
    medicalAcuity,
    transferReasons
  } = req.body;

  try {
    // Find the current ward
    const currentWardData = await Bed.findOne({ 'wards.name': currentWard });

    if (!currentWardData) {
      return res.status(400).json({ error: 'Current ward does not exist.' });
    }

    // Find the current bed within the current ward
    const currentWardRecord = currentWardData.wards.find((ward) => ward.name === currentWard);
    const currentBed = currentWardRecord.beds.find((bed) => bed.number === currentBedNumber);

    if (!currentBed) {
      return res.status(400).json({ error: 'Current bed does not exist in the selected ward.' });
    }

    if (transferWard && transferBedNumber) {
      // Find the transfer ward
      const transferWardData = await Bed.findOne({ 'wards.name': transferWard });

      if (!transferWardData) {
        return res.status(400).json({ error: 'Transfer ward does not exist.' });
      }

      // Find the transfer bed within the transfer ward
      const transferWardRecord = transferWardData.wards.find((ward) => ward.name === transferWard);
      const transferBed = transferWardRecord.beds.find((bed) => bed.number === transferBedNumber);

      if (!transferBed) {
        return res.status(400).json({ error: 'Transfer bed does not exist in the selected ward.' });
      }

      // Check if the transfer bed is available
      if (transferBed.status !== 'available') {
        return res.status(400).json({ error: 'Transfer bed is not available.' });
      }

      // Update the current bed to available
      currentBed.status = 'available';
      currentBed.patientName = '';
      currentBed.medicalAcuity = '';
      currentBed.age = '';
      currentBed.gender = '';
      currentBed.contactno = '';
      currentBed.patientId = '';

      // Update the transfer bed to occupied with patient information
      transferBed.status = 'occupied';
      transferBed.patientName = patientName;
      transferBed.medicalAcuity = medicalAcuity;
      transferBed.age = age;
      transferBed.gender = gender;
      transferBed.patientId = patientId;
      transferBed.contactno = contactno;

      // Save changes to the database
      await currentWardData.save();
      await transferWardData.save();

      // Save transfer information to Transfer collection
      const transfer = new Transfer({
        patientName,
        age,
        gender,
        patientId,
        contactno,
        currentWard,
        currentBedNumber,
        transferWard,
        transferBedNumber,
        currentdept,
        transferdept,
        medicalAcuity,
        transferReasons
      });

      await transfer.save();

      res.json({ message: 'Patient transfer successful.' });
    } else {
      // Release the current bed
      currentBed.status = 'available';
      currentBed.patientName = '';
      currentBed.medicalAcuity = '';
      currentBed.age = '';
      currentBed.gender = '';
      currentBed.contactno = '';
      currentBed.patientId = '';
      currentBed.admissionDate='';
      currentBed.admissionTime='';
      currentBed.riskScore='';


      await currentWardData.save();

      res.json({ message: 'Current bed saved successfully.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error performing bed action.' });
  }
});


//Transfer Landing Page:
router.put('/transfer/:patientId', async (req, res) => {
  const patientId = req.params.patientId;
  const {
    name,
    age,
    gender,
    contactno,
    transferWard,
    transferBedNumber,
    medicalAcuity,
    transferReasons
  } = req.body;

  try {
    // Find the patient's current transfer record by patientId
    const transfer = await Transfer.findOne({ patientId });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer record not found.' });
    }

    // Update the fields you want to change in the transfer record
    transfer.name = name || transfer.name;
    transfer.age = age || transfer.age;
    transfer.gender = gender || transfer.gender;
    transfer.contactno = contactno || transfer.contactno;
    transfer.transferWard = transferWard || transfer.transferWard;
    transfer.transferBedNumber = transferBedNumber || transfer.transferBedNumber;
    transfer.medicalAcuity = medicalAcuity || transfer.medicalAcuity;
    transfer.transferReasons = transferReasons || transfer.transferReasons;

    // Save the updated transfer data
    await transfer.save();

    // Find the transfer bed in the new ward
    const newWardData = await Bed.findOne({ 'wards.name': transferWard });

    if (!newWardData) {
      return res.status(400).json({ error: 'New ward does not exist.' });
    }

    const newTransferBed = newWardData.wards
      .find(ward => ward.name === transferWard)
      .beds.find(bed => bed.number === transferBedNumber);

    if (!newTransferBed) {
      return res.status(400).json({ error: 'New transfer bed does not exist.' });
    }

  // Update the new transfer bed with patient information
    newTransferBed.status = 'occupied';
    newTransferBed.patientName = name;
    newTransferBed.medicalAcuity = medicalAcuity;
    newTransferBed.age = age;
    newTransferBed.gender = gender;
    newTransferBed.patientId = patientId;
    newTransferBed.contactno = contactno;

    // Save the updated bed data
    await newWardData.save();

    res.json({ message: 'Transfer data and bed updated successfully.' });
  } catch (error) {
    console.error('Transfer edit error:', error);
    res.status(500).json({ error: 'Error updating transfer data and bed.' });
  }
});


//Transfer Landing Page Delete:

router.delete('/trans/:patientId', async (req, res) => {
  const { patientId } = req.params;

  try {
    // Find and delete the patient from the Patient model
    const deletetrans= await Transfer.deleteOne({ patientId });

    if (deletetrans.deletedCount === 0) {
      return res.status(404).json({ error: 'Transfer Patient not found.' });
    }

    // Update the patient's details in the Bed model
    const beds = await Bed.find({ 'wards.beds.patientId': patientId });

    if (beds && beds.length > 0) {
      for (const bed of beds) {
        for (const ward of bed.wards) {
          const bedIndex = ward.beds.findIndex((bedInfo) => bedInfo.patientId === patientId);

          if (bedIndex !== -1) {
            // Clear patient details in the bed record
            const TransferBed = ward.beds[bedIndex];
            TransferBed.status = 'available';
            TransferBed.patientName = '';
            TransferBed.gender = '';
            TransferBed.age = '';
            TransferBed.contactno = '';
            TransferBed.patientId = '';
            TransferBed.medicalAcuity = '';
            TransferBed.address = '';
            TransferBed.admissionDate = '';
          }
        }
        await bed.save();
      }
    }

    res.json({ message: ' Transfer Patient admitted data deleted successfully.' });
  } catch (error) {
    console.error('Error deleting admitted patient data:', error);
    res.status(500).json({ error: 'Error deleting admitted patient data.' });
  }
});


////transfer:


router.get('/tee', async (req, res) => {
  try {
    const tras = await Transfer.find();
    res.json(tras);
  } catch (error) {
    res.json(error);
  }
});

//discharge of patient:1:{latest}:


router.post('/discharge', async (req, res) => {
  try {
    const {
      patientId,
      wards,
      number,
      patientName,
      gender,
      age,
      admissionDate,
      medicalAcuity,
      dischargeReasons,
      dischargeDate,
      dischargeTime
    } = req.body;
// Find the bed within the ward
const bed = await Bed.findOne({ 'wards.name': wards });

if (!bed) {
  return res.status(404).json({ error: 'Ward not found.' });
}

// Find the specific bed within the ward
const wardIndex = bed.wards.findIndex(w => w.name === wards);
const bedIndex = bed.wards[wardIndex].beds.findIndex(b => b.number === number);

if (bedIndex === -1) {
  return res.status(404).json({ error: 'Bed not found in the ward.' });
}

const selectedBed = bed.wards[wardIndex].beds[bedIndex];

if (selectedBed.status === 'occupied' && selectedBed.patientId === patientId) {
  // Clear patient details in the bed record
  selectedBed.status = 'available';
  selectedBed.patientName = '';
  selectedBed.gender = '';
  selectedBed.age = '';
  selectedBed.contactno = '';
  selectedBed.patientId = '';
  selectedBed.medicalAcuity = '';
  selectedBed.address = '';
  selectedBed.admissionDate='';
  selectedBed.admissionTime='';
  selectedBed.riskScore='';


  // Save the updated bed record
  await bed.save();

  // Create a discharged record with all the data fields
  const discharged = new Discharged({
    
      patientName,
      age,
      gender,
      patientId,
      admissionDate,
      dischargeDate,
      dischargeTime, // Set the discharge date to the current date
    
    wards,
    number,
    medicalAcuity,
    dischargeReasons,
  });

  // Save the discharged record
  await discharged.save();

  res.json({ message: 'Patient discharged and bed record deleted successfully.' });
} else {
  res.status(400).json({ error: 'Patient not found in the bed or not discharged.' });
}
} catch (error) {
console.error(error);
res.status(500).json({ error: 'Error discharging patient and deleting bed record.' });
}
});

module.exports = router;
   




//get discharge method:
router.get('/Disget',async(req,res)=>{
  try{
    const h1 = await Discharged.find()
    res.json(h1)
    console.log(h1);
  }
  catch(error){
      res.json(error)
  }
})

module.exports=router;

//discharge patient eee code:
router.put('/dischargedd/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId; // Get patientId from the URL parameter

    const {
      patientName,
      gender,
      age,
      //admissionDate,
      medicalAcuity,
      dischargeReasons,
      dischargeDate,
    } = req.body;

    // Find the discharged record using the patientId
    const discharged = await Discharged.findOne({ 'patientId': patientId });

    if (!discharged) {
      return res.status(404).json({ error: 'Patient not found in discharged records.' });
    }

    // Update patient details in the discharged record
    discharged.patientName = patientName;
    discharged.age = age;
    discharged.gender = gender;
    //discharged.patient.admissionDate = admissionDate;
    discharged.dischargeDate = dischargeDate;
    discharged.medicalAcuity = medicalAcuity;
    discharged.dischargeReasons = dischargeReasons;

    // Save the updated discharged record
    await discharged.save();

    res.json({ message: 'Patient information updated in discharge record successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating patient information in discharge record.' });
  }
});
//landing page delete  for discharg:
router.delete('/add/:patientId', async (req, res) => {
  const { patientId } = req.params;

  try {
    // Find and delete the patient from the Patient model
    const deletetrans= await Discharged.deleteOne({ patientId });

    if (deletetrans.deletedCount === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    
    res.json({ message: ' Transfer Patient admitted data deleted successfully.' });
  } catch (error) {
    console.error('Error deleting admitted patient data:', error);
    res.status(500).json({ error: 'Error deleting admitted patient data.' });
  }
});


//DASHBOARD full details:
//dashboard:
router.get('/bed1d', async (req, res) => {
  try {
    const bedsData = await Bed.findOne(); // Assuming you have only one document with all beds

    if (!bedsData) {
      return res.status(404).json({ message: 'No bed data found.' });
    }

    //const today = moment();
    const thisWeekStart = moment().startOf('isoWeek');
    const thisMonthStart = moment().startOf('month');

    const bedStatusPerWard = {};

    // Iterate through the wards
    bedsData.wards.forEach((ward) => {
      const wardName = ward.name;
      //let occupiedBedsToday = 0;
      let occupiedBedsThisWeek = 0;
      let occupiedBedsThisMonth = 0;

      ward.beds.forEach((bed) => {
        if (bed.status === 'occupied') {
          const occupiedDate = moment(bed.occupiedTimestamp);
         // if (occupiedDate.isSame(today, 'day')) {
           // occupiedBedsToday++;
         // }
          if (occupiedDate.isSameOrAfter(thisWeekStart, 'day')) {
            occupiedBedsThisWeek++;
          }
          if (occupiedDate.isSameOrAfter(thisMonthStart, 'day')) {
            occupiedBedsThisMonth++;
          }
        }
      });

      const availableBeds = ward.beds.filter((bed) => bed.status === 'available').length;

      bedStatusPerWard[wardName] = {
       // occupiedTodayBeds: occupiedBedsToday,
        occupiedThisWeekBeds: occupiedBedsThisWeek,
        occupiedThisMonthBeds: occupiedBedsThisMonth,
        availableBeds: availableBeds,
      };
    });
// Calculate admission statistics dynamically
const admissionStatistics = {
 // today: Object.values(bedStatusPerWard).reduce((total, ward) => total + ward.occupiedTodayBeds, 0),
  thisWeek: Object.values(bedStatusPerWard).reduce((total, ward) => total + ward.occupiedThisWeekBeds, 0),
  thisMonth: Object.values(bedStatusPerWard).reduce((total, ward) => total + ward.occupiedThisMonthBeds, 0),
};
    res.json({
      bedStatusPerWard,  admissionStatistics,

    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//date with bednumber:
router.get('/bn', async (req, res) => {
  try {
    // Find all beds with occupied status
    const occupiedBeds = await Bed.find({ 'wards.beds.status': 'occupied' });

    if (!occupiedBeds || occupiedBeds.length === 0) {
      return res.status(404).json({ message: 'No occupied beds found.' });
    }

    const admissionData = [];

    occupiedBeds.forEach((bed) => {
      bed.wards.forEach((ward) => {
        ward.beds.forEach((bed) => {
          if (bed.status === 'occupied') {
            const admissionDate = bed.admissionDate;
            const bedNumber = bed.number;
            //const patientName = bed.patientName;

            admissionData.push({
              admissionDate,
              bedNumber,
             // patientName,
            });
          }
        });
      });
    });

    res.json(admissionData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//patientname with date:
router.get('/pdate', async (req, res) => {
  try {
    // Find all beds with occupied status
    const occupiedBeds = await Bed.find({ 'wards.beds.status': 'occupied' });

    if (!occupiedBeds || occupiedBeds.length === 0) {
      return res.status(404).json({ message: 'No occupied beds found.' });
    }

    const admissionData = [];

    occupiedBeds.forEach((bed) => {
      bed.wards.forEach((ward) => {
        ward.beds.forEach((bed) => {
          if (bed.status === 'occupied') {
            const admissionDate = bed.admissionDate;
           // const bedNumber = bed.number;
            const patientName = bed.patientName;

            admissionData.push({
              admissionDate,
              //bedNumber,
              patientName,
            });
          }
        });
      });
    });

    res.json(admissionData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports=router;
