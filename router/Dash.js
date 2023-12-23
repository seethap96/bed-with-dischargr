const express = require('express');
const router = express.Router();
const moment = require('moment');
const ClinicalOutcomeComparison=require('../model/ClinicalOutcomeComparison');
const Bed =  require('../model/Beda');
const Patient = require('../model/Patient');
const Transfer=require('../model/transfer');
const Discharged=require('../model/discharge');
const { model } = require('mongoose');


//1.display the bed availble count:(this code gives total available bed count with correct time slot pdf format)
router.get('/availbedcount', async (req, res) => {
  try {
    const beds = await Bed.find({ 'wards.beds.status': 'available' });

    if (!beds || beds.length === 0) {
      return res.status(404).json({ message: 'No available beds found.' });
    }

    const availableBeds = {};

    beds.forEach((bed) => {
      bed.wards.forEach((ward) => {
        ward.beds.forEach((individualBed) => {
          if (individualBed.status === 'available') {
            const wardName = ward.name;
            const admissionTime = individualBed.admissionTime;

            if (!availableBeds[wardName]) {
              availableBeds[wardName] = {};
            }

            if (!availableBeds[wardName][admissionTime]) {
              availableBeds[wardName][admissionTime] = 0;
            }

            availableBeds[wardName][admissionTime]++;
          }
        });
      });
    });

    const result = [];

    for (const wardName in availableBeds) {
      for (const admissionTime in availableBeds[wardName]) {
        const availableBedsCount = availableBeds[wardName][admissionTime];
        result.push({
          Ward: wardName,
          admissionTime: admissionTime,
          AvailableBeds: availableBedsCount,
        });
      }
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});









//2.occupied beds by wards:

///2.OCCUPIED BEDS TO COUNT:( it gives only ward A:11 like this output single line formar)

/*router.get('/occupied-beds-by-ward', async (req, res) => {
  try {
    const occupiedBeds = await Bed.find({ 'wards.beds.status': 'occupied' });

    if (!occupiedBeds || occupiedBeds.length === 0) {
      return res.status(404).json({ message: 'No occupied beds found.' });
    }

    let wardACount = 0;
    let wardBCount = 0;

    occupiedBeds.forEach((bed) => {
      bed.wards.forEach((ward) => {
        if (ward.name === 'Ward A') {
          wardACount += ward.beds.filter((bed) => bed.status === 'occupied').length;
        } else if (ward.name === 'Ward B') {
          wardBCount += ward.beds.filter((bed) => bed.status === 'occupied').length;
        }
      });
    });

    const result = {
      'Ward A': wardACount,
      'Ward B': wardBCount,
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});*/

//2.ward occupancy  beds
router.get('/ward-occupancy', async (req, res) => {
  try {
    const occupiedBeds = await Bed.find({ 'wards.beds.status': 'occupied' });

    if (!occupiedBeds || occupiedBeds.length === 0) {
      return res.status(404).json({ message: 'No occupied beds found.' });
    }

    const wardOccupancy = [];

    occupiedBeds.forEach((bed) => {
      bed.wards.forEach((ward) => {
        const wardName = ward.name;
        const occupiedCount = ward.beds.filter(bed => bed.status === 'occupied').length;

        wardOccupancy.push({ ward: wardName, occupancy: occupiedCount });
      });
    });

    res.json({ wardOccupancy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
//3.to display realtime available beds in wards
router.get('/availablebeds', async (req, res) => {
  try {
    const availableBeds = await Bed.find({ 'wards.beds.status': 'available' });

    if (!availableBeds || availableBeds.length === 0) {
      return res.status(404).json({ message: 'No available beds found.' });
    }

    const realTimeBedAvailability= [];

    availableBeds.forEach((bed) => {
      bed.wards.forEach((ward) => {
        const wardName = ward.name;
        const availableCount = ward.beds.filter(bed => bed.status === 'available').length;

        realTimeBedAvailability.push({ ward: wardName, availableBeds: availableCount });
      });
    });

    res.json({ realTimeBedAvailability });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports=router;
//4.medicalAcuity:
router.get('/medical-acuity', async (req, res) => {
  try {
    const bedsData = await Bed.findOne(); // Assuming you have only one document with all beds

    if (!bedsData) {
      return res.status(404).json({ message: 'No bed data found.' });
    }

    const patientAcuityBreakdown = [];

    // Iterate through the wards
    bedsData.wards.forEach((ward) => {
      const wardName = ward.name;
      const breakdown = {
        wardName: wardName,
        Critical: 0,
        Moderate: 0,
        Stable: 0,
      };

      ward.beds.forEach((bed) => {
        if (bed.status === 'occupied') {
          breakdown[bed.medicalAcuity]++;
        }
      });

      patientAcuityBreakdown.push(breakdown);
    });

    res.json({ patientAcuityBreakdown });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



//5.Dashboard 5
// Define a GET route to fetch admissions and discharges trend data
router.get('/admission-discharge', async (req, res) => {
  try {
    // Fetch all admissions and discharges records from the Patient and Discharged collections
    const admissions = await Patient.find({}, 'admissionDate');
    const discharges = await Discharged.find({}, 'dischargeDate');

    // Combine admissions and discharges data
    const allEvents = [...admissions, ...discharges];

    // Create a data structure to group admissions and discharges by date
    const trendData = {};

    allEvents.forEach((event) => {
      // Check if the date field is defined
      if (event.admissionDate || event.dischargeDate) {
        const formattedDate = formatDate(event.admissionDate || event.dischargeDate);

        if (!trendData[formattedDate]) {
          trendData[formattedDate] = { admissions: 0, discharges: 0 };
        }

        if (event.admissionDate) {
          trendData[formattedDate].admissions += 1;
        } else if (event.dischargeDate) {
          trendData[formattedDate].discharges += 1;
        }
      }
    });

    // Convert the data structure into the desired output format
    const admissionsDischargesTrend = Object.entries(trendData).map(([date, data]) => ({
      date,
      admissions: data.admissions,
      discharges: data.discharges,
    }));

    res.json({ admissionsDischargesTrend });
  } catch (error) {
    console.error('Error fetching admissions and discharges trend data:', error);
    res.status(500).json({ error: 'Error fetching admissions and discharges trend data.' });
  }
});

// Helper function to format dates to "DD-MM-YYYY" format
function formatDate(dateString) {
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString; // Return unchanged if not in the expected format
}
//auto ID generate of patient:


//admit:
// Initialize the patient ID counter

// Define a set to keep track of occupied beds
const occupiedBeds = new Set();

// Function to generate a unique patient ID sequentially
let patientIdCounter = 1;

function generatePatientID() {
  const patientID = 'PAT' + patientIdCounter;
  patientIdCounter++;
  return patientID;
}
router.post('/admitpt', async (req, res) => {
  const {
    name,
    age,
    gender,
    contactno,
    ward,
    bedNumber,
    medicalAcuity,
    admittingDoctors,
    admissionDate,
    admissionTime,
    address
  } = req.body;

  try {
    // Check if the patient with the same ID already exists
    const existingPatient = await Patient.findOne({ patientId: bedNumber });

    if (existingPatient) {
      return res.status(400).json({ error: 'A patient with the same ID already exists.' });
    }

    // Check if the bed is already occupied
    if (occupiedBeds.has(bedNumber)) {
      return res.status(400).json({ error: 'Selected bed is already occupied.' });
    }

    const patientId = generatePatientID();

    const newPatient = new Patient({
      name,
      age,
      gender,
      contactno,
      patientId,
      ward,
      bedNumber,
      medicalAcuity,
      admittingDoctors,
      admissionDate,
      admissionTime,
      address
    });

    const savedPatient = await newPatient.save();

    // Mark the bed as occupied in the bed collection
    const bedData = await Bed.findOne({ 'wards.name': ward });

    if (!bedData) {
      return res.status(400).json({ error: 'Ward does not exist.' });
    }

    // Find the correct ward and bed
    const wardData = bedData.wards.find((wardItem) => wardItem.name === ward);

    if (!wardData) {
      return res.status(400).json({ error: 'Ward does not exist in bed data.' });
    }

    const bed = wardData.beds.find((bedItem) => bedItem.number === bedNumber);

    if (!bed) {
      return res.status(400).json({ error: 'Bed does not exist in the selected ward.' });
    }

    // Update bed status and patient information
    bed.status = 'occupied';
    bed.patientName = name;
    bed.medicalAcuity = medicalAcuity;
    bed.age = age;
    bed.gender = gender;
    bed.patientId = patientId;
    bed.contactno = contactno;
bed.admissionDate=admissionDate;
bed.admissionTime=admissionTime;
    // Save changes to the bed data
    await bedData.save();

    // Mark the bed as occupied in the occupiedBeds Set
    occupiedBeds.add(bedNumber);

    res.status(201).json(savedPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//6.Dashboard task ://adding task and assignedNurse:
// POST method to add a new patient

router.post('/admittask', async (req, res) => {
  const {
    name,
    age,
    gender,
    contactno,
    patientId,
    ward,
    bedNumber,
    medicalAcuity,
    admittingDoctors,
    admissionDate,
    admissionTime,
    address,
    assignedNurse,
    tasks,
  } = req.body;
// Bed is available, proceed with admitting the patient
const patientAddresses = address.map(addr => ({
  doorno: addr.doorno,
  streetname: addr.streetname,
  district: addr.district,
  state: addr.state,
  country: addr.country,
  pincode: addr.pincode
}));

  // Rest of your code here...

  try {
    // Check if the bed exists
    const bed = await Bed.findOne({
      'wards.name': ward,
      'wards.beds.number': bedNumber,
    });

    if (!bed) {
      return res.status(400).json({ error: 'Selected bed does not exist.' });
    }

    // Find the target ward and bed
    const targetWard = bed.wards.find(wardData => wardData.name === ward);

    if (!targetWard) {
      return res.status(400).json({ error: 'Selected ward does not exist.' });
    }

    const targetBed = targetWard.beds.find(b => b.number === bedNumber);

    if (!targetBed) {
      return res.status(400).json({ error: 'Selected bed does not exist.' });
    }

    // Check if the bed is already occupied
    if (targetBed.status === 'occupied') {
      //console.log('select bed is occupied');
      return res.status(400).json({ error: 'Selected bed is already occupied.' });
    }

    // Update bed availability for the chosen bed
    targetBed.status = 'occupied';
    targetBed.patientName = name;
    targetBed.age = age;
    targetBed.gender = gender;
    targetBed.contactno = contactno;
    targetBed.patientId = patientId;
    targetBed.medicalAcuity = medicalAcuity;
    targetBed.admissionDate = admissionDate;
    targetBed.admissionTime=admissionTime;
    targetBed.assignedNurse=assignedNurse;
    targetBed.tasks=tasks;

  //targetBed.admissionTime = admissionTime;

    // Update the patient's bed information
    const patient = new Patient({
      name,
      age,
      gender,
      contactno,
      patientId,
      ward,
      bedNumber,
      medicalAcuity,
      admittingDoctors,
      admissionDate,
      
      admissionTime,
      address: patientAddresses,
      assignedNurse,
tasks,
    });

    // Save the patient record
    await patient.save();

    // Save the updated bed information
    await bed.save();

    // Respond with the patient details
    res.json({
      message: 'Patient submitted successfully and bed updated.',
      patient: {
        name,
        age,
        gender,
        contactno,
        patientId,
        ward,
        bedNumber,
        medicalAcuity,
        admittingDoctors,
        admissionDate,
        admissionTime,
        address: patientAddresses,
        assignedNurse,
        tasks,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error submitting patient data.' });
  }
});

module.exports = router;

// GET method to retrieve a selected list of patients
router.get('/selected', async (req, res) => {
  try {
    const selectedPatients = await Patient.find({}, 'name medicalAcuity assignedNurse tasks.taskType tasks.description');
    res.json({ patients: selectedPatients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving selected patients' });
  }
});





//7.riskscore:
let patientIdCounte = 1;

// Route to calculate and send patient risk scores
router.post('/calrisk', async (req, res) => {
  const {
    name,
    age,
    gender,
    contactno,
    ward,
    bedNumber,
    medicalAcuity,
    admittingDoctors,
    admissionDate,
    admissionTime,
    address,
  } = req.body;

  try {
    // Check if the bed is already occupied
    if (occupiedBeds.has(bedNumber)) {
      return res.status(400).json({ error: 'Selected bed is already occupied.' });
    }

    // Generate the next patient ID
    const patientId = `P${patientIdCounte}`;
    patientIdCounte++;

    // Calculate risk score based on medical acuity
    const riskScore = calculateRiskScore(medicalAcuity);

    const newPatient = new Patient({
      name,
      age,
      gender,
      contactno,
      patientId, // Use the generated patient ID
      ward,
      bedNumber,
      medicalAcuity,
      admittingDoctors,
      admissionDate,
      admissionTime,
      address,
      riskScore, // Add the calculated risk score to the patient data
    });

    const savedPatient = await newPatient.save();

    // Mark the bed as occupied in the bed collection
    const bedData = await Bed.findOne({ 'wards.name': ward });
    if (!bedData) {
      return res.status(400).json({ error: 'Ward does not exist.' });
    }

    // Find the correct ward and bed
    const wardData = bedData.wards.find((wardItem) => wardItem.name === ward);
    if (!wardData) {
      return res.status(400).json({ error: 'Ward does not exist in bed data.' });
    }

    const bed = wardData.beds.find((bedItem) => bedItem.number === bedNumber);
    if (!bed) {
      return res.status(400).json({ error: 'Bed does not exist in the selected ward.' });
    }

    // Update bed status and patient information
    bed.status = 'occupied';
    bed.patientName = name;
    bed.medicalAcuity = medicalAcuity;
    bed.age = age;
    bed.gender = gender;
    bed.patientId = patientId; // Use the generated patient ID
    bed.contactno = contactno;
    bed.riskScore = riskScore; // Add the calculated risk score to the bed data

    // Save changes to the bed data
    await bedData.save();

    // Mark the bed as occupied in the occupiedBeds Set
    occupiedBeds.add(bedNumber);

    res.status(201).json(savedPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




//get method for risk score:
router.get('/patientriskget', async (req, res) => {
  try {
    // Find all patients in the database
    const patients = await Patient.find();

    // Extract patient names, medical acuity, and risk scores
    const patientData = patients.map((patient) => ({
      name: patient.name,
      medicalAcuity: patient.medicalAcuity,
      riskScore: patient.riskScore,
    }));

    // Send back the patient data
    res.status(200).json(patientData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

//8.turnaroundTime:
router.get('/bedturnarounds', async (req, res) => {
  try {
    const bedTurnaroundTime = [];

    // Find all discharged patients
    const dischargedPatients = await Discharged.find();

    // Iterate through discharged patients
    for (const dischargedPatient of dischargedPatients) {
      const { ward, bedNumber, dischargeDate, dischargeTime } = dischargedPatient;

      // Find the corresponding admission for the discharged patient
      const admissionPatient = await Patient.findOne({
        ward,
        bedNumber,
        admissionDate: { $eq: dischargeDate }, // Find admission on the same date
        admissionTime: { $gt: dischargeTime }, // Find admission after discharge time
      }).sort({ admissionTime: 1 }); // Sort to get the earliest admission

      if (admissionPatient) {
        // Explicitly specify the date and time formats
        const dateFormat = 'DD-MM-YYYY'; // Modify this format to match your data
        const timeFormat = 'hh:mm A'; // Modify this format to match your data

        const dischargeDateTime = moment(`${dischargeDate} ${dischargeTime}`, `${dateFormat} ${timeFormat}`);
        const admissionDateTime = moment(`${admissionPatient.admissionDate} ${admissionPatient.admissionTime}`, `${dateFormat} ${timeFormat}`);

        const turnaroundTime = admissionDateTime.diff(dischargeDateTime, 'minutes');

        // Format the date as "YYYY-MM-DD"
        const formattedDate = moment(dischargeDate, dateFormat).format('YYYY-MM-DD');

        bedTurnaroundTime.push({
          ward,
          bedNumber, // Add bedNumber to the object
          admissiondate: formattedDate,
          turnaroundTime,
        });
      }
    }

    res.json({ bedTurnaroundTime });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }

});
                                ///RiskScore: tasks: PatientID generate:
  //finalized admit router:

// let patientIdCounts= 0; // Initialize the patient ID counter

// // Function to generate a unique patient ID
// function generatePatientID() {
//   patientIdCounts += 1;
//   return `PAT${patientIdCounts.toString().padStart(4, '0')}`;
// }

// // Function to calculate the risk score based on medical acuity
// function calculateRiskScore(medicalAcuity) {
//   switch (medicalAcuity) {
//     case "Critical":
//       return 0.85;
//     case "Moderate":
//       return 0.65;
//     case "Stable":
//       return 0.45;
//     default:
//       return 0.1; // Default risk score for unknown or unassigned medical acuity
//   }
// }

// router.post('/admitpt1', async (req, res) => {
//   const {
//     name,
//     age,
//     gender,
//     contactno,
//     ward,
//     bedNumber,
//     medicalAcuity,
//     admittingDoctors,
//     admissionDate,
//     admissionTime,
//     assignedNurse,tasks,
//     address,
//     abhaNo,
//   } = req.body;

//   try {
//     // Check if the patient with the same ID already exists
//     const existingPatient = await Patient.findOne({ patientId: bedNumber });

//     if (existingPatient) {
//       return res.status(400).json({ error: 'A patient with the same ID already exists.' });
//     }

//     // Check if the bed is already occupied
//     if (occupiedBeds.has(bedNumber)) {
//       return res.status(400).json({ error: 'Selected bed is already occupied.' });
//     }

//     const patientId = generatePatientID();
// // Calculate risk score based on medical acuity
// const riskScore = calculateRiskScore(medicalAcuity);

//     const newPatient = new Patient({
//       name,
//       age,
//       gender,
//       contactno,
//       patientId,
//       ward,
//       bedNumber,
//       medicalAcuity,
//       admittingDoctors,
//       admissionDate,
//       admissionTime,
//       address,
//       abhaNo,
//       assignedNurse,tasks,riskScore,
//     });

//     const savedPatient = await newPatient.save();

//     // Mark the bed as occupied in the bed collection
//     const bedData = await Bed.findOne({ 'wards.name': ward });

//     if (!bedData) {
//       return res.status(400).json({ error: 'Ward does not exist.' });
//     }

//     // Find the correct ward and bed
//     const wardData = bedData.wards.find((wardItem) => wardItem.name === ward);

//     if (!wardData) {
//       return res.status(400).json({ error: 'Ward does not exist in bed data.' });
//     }

//     const bed = wardData.beds.find((bedItem) => bedItem.number === bedNumber);

//     if (!bed) {
//       return res.status(400).json({ error: 'Bed does not exist in the selected ward.' });
//     }

//     // Update bed status and patient information
//     bed.status = 'occupied';
//     bed.patientName = name;
//     bed.medicalAcuity = medicalAcuity;
//     bed.age = age;
//     bed.gender = gender;
//     bed.patientId = patientId;
//     bed.contactno = contactno;
//     bed.admissionDate=admissionDate;
//     bed.admissionTime=admissionTime;
//     bed.assignedNurse=assignedNurse;
//     bed.tasks=tasks;
//     bed.riskScore=riskScore;
//     // Save changes to the bed data
//     await bedData.save();

//     // Mark the bed as occupied in the occupiedBeds Set
//     occupiedBeds.add(bedNumber);

//     res.status(201).json(savedPatient);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });


//9.
router.get('/rates', async (req, res) => {
  try {
    // Define infection and mortality rates for different months
    const rates = {
      august: { infectionRate: 0.40, mortalityRate: 0.50 },
      september: { infectionRate: 0.60, mortalityRate: 0.60 },
      october: { infectionRate: 0.75, mortalityRate: 0.00 },
    };

    // Create an object to store the rates for Ward A for each month
    const admissionMonths = ['august', 'september', 'october'];
    const rateResults = {};

    for (const admissionMonth of admissionMonths) {
      // Query the patient data for patients admitted in Ward A for the specific month
      const patients = await Patient.find({
        ward: 'A',
        admissionDate: {
          $gte: new Date(`2023-${admissionMonth}-01`),
          $lte: new Date(`2023-${admissionMonth}-31T23:59:59`),
        },
      });

      // Get the rates for the current month
      const ratesForMonth = rates[admissionMonth];

      // Calculate the infection and mortality rates for the current month
      const { infectionRate, mortalityRate } = ratesForMonth;

      // Store the rates in the results object
      rateResults[admissionMonth] = {
        infectionRate,
        mortalityRate,
      };
    }

    // Respond with the calculated rates for Ward A
    res.json({
      wardA: rateResults,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching rates.' });
  }
});

//

router.post('/discharge', async (req, res) => {
  try {
    const {
      patientId,
      ward,
      bedNumber,
      name, // Include patientName in the request
      gender, // Include gender in the request
      age, // Include age in the request
      admissionDate,
      admissionTime,
      dischargeDate, // Include admissionDate in the request
      dischargeTime,
      medicalAcuity, // Include medicalAcuity in the request
      dischargeReasons,
       // Include dischargeReasons in the request
    } = req.body;

    // Find the bed within the ward
    const bed = await Bed.findOne({ 'wards.name': ward });

    if (!bed) {
      return res.status(404).json({ error: 'Ward not found.' });
    }

    // Find the specific bed within the ward
    const wardIndex = bed.wards.findIndex(w => w.name === ward);
    const bedIndex = bed.wards[wardIndex].beds.findIndex(b => b.number === bedNumber);

    if (bedIndex === -1) {
      return res.status(404).json({ error: 'Bed not found in the ward.' });
    }

    const selectedBed = bed.wards[wardIndex].beds[bedIndex];

    if (selectedBed.status === 'occupied' && selectedBed.patientId === patientId) {
      // Clear patient details in the bed record
      selectedBed.status = 'available';
      selectedBed.patientName = '';
      selectedBed.gender = '';
      selectedBed.age = ''
      selectedBed.contactno = '';
      selectedBed.patientId = '';
      selectedBed.medicalAcuity = '';
      selectedBed.address = '';
      selectedBed.admissionDate = '';
      selectedBed.admissionTime = ''
      selectedBed.riskScore='';

      // Save the updated bed record
      await bed.save();

      // Create a discharged record with all the data fields
      const discharged = new Discharged({
          name,
          age,
          gender,
          patientId,
          admissionDate,
          admissionTime,
          dischargeDate, // Set the discharge date to the current date
          dischargeTime,
        ward,
        bedNumber,
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

//10.transfer action should be preformed
router.post('/bedaction', async (req, res) => {
  const {
    currentWard,
    currentBedNumber,
    name,
    age,
    gender,
    contactno,
    patientId,
    transferWard,
    transferBedNumber,
    currentdept,
    transferdept,
    medicalAcuity,
    transferReason
  } = req.body;

  try {
    const currentWardData = await Bed.findOne({ 'wards.name': currentWard });
    if (!currentWardData) {
      return res.status(400).json({ error: 'Current ward does not exist.' });
    }

    const currentBed = currentWardData.wards.find(ward => ward.name === currentWard)
      .beds.find(bed => bed.number === currentBedNumber);

    if (!currentBed) {
      return res.status(400).json({ error: 'Current bed does not exist.' });
    }

    if (transferWard && transferBedNumber) {
      // Transfer patient functionality
      const transferWardData = await Bed.findOne({ 'wards.name': transferWard });
      if (!transferWardData) {
        return res.status(400).json({ error: 'Transfer ward does not exist.' });
      }

      const transferBed = transferWardData.wards.find(ward => ward.name === transferWard)
        .beds.find(bed => bed.number === transferBedNumber);

      if (!transferBed) {
        return res.status(400).json({ error: 'Transfer bed does not exist.' });
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
      currentBed.admissionDate = '';
      //currentBed.admissionTime = '';

      // Update the transfer bed to occupied with patient information
      transferBed.status = 'occupied';
      transferBed.patientName = name;
      transferBed.medicalAcuity = medicalAcuity;
      transferBed.age = age;
      transferBed.gender = gender;
      transferBed.patientId = patientId;
      transferBed.contactno = contactno;

      await currentWardData.save();
      await transferWardData.save();

      // Save transfer information to Transfer collection
      const transfer = new Transfer({
        name,
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
        transferReason
      });
      await transfer.save();

      res.json({ message: 'Patient transfer successful.' });
    } else {
      // Update the current bed to available (release bed functionality)
      currentBed.status = 'available';
      currentBed.patientName = '';
      currentBed.medicalAcuity = '';
      currentBed.age = '';
      currentBed.gender = '';
      currentBed.contactno = '';
      currentBed.patientId = '';
      currentBed.admissionDate = '';
     // currentBed.admissionTime = '';

      await currentWardData.save();

      res.json({ message: 'Current bed saved successfully.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error performing bed action.' });
  }
});

module.exports=router;

router.get('/patientflow', async (req, res) => {
  try {
    const patientFlow = [];

    // Find all transfer records
    const transferRecords = await Transfer.find();

    // Create a map to store patient flow counts
    const patientFlowMap = {};

    // Iterate through transfer records and count the flows from currentdept to transferdept
    for (const transfer of transferRecords) {
      const { currentdept, transferdept } = transfer;
      console.log(`currentdept: ${currentdept}, transferdept: ${transferdept}`);

      // Create a unique key for each patient flow
      const flowKey = `${currentdept} to ${transferdept}`;

      // Increment the count for the flow in the map
      patientFlowMap[flowKey] = (patientFlowMap[flowKey] || 0) + 1;
    }

    // Convert the map to the desired output format
    for (const key in patientFlowMap) {
      const [from, to] = key.split(' to ');
      const value = patientFlowMap[key];

      patientFlow.push({ from, to, value });
    }

    res.json({ patientFlow });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//.dashboard 9:


module.exports = router;
// Define a GET route to retrieve clinical outcome comparison data

//dashboard 11:


router.post('/clinical', async (req, res) => {
  try {
    // Extract data from the request body
    const { ward, timeInterval, mortalityRate, infectionRate, avgLengthOfStay, readmissionRate, date } = req.body;

    // Create a new clinical outcome comparison document
    const newClinicalOutcomeComparison = new ClinicalOutcomeComparison({
      ward,
      timeInterval,
      mortalityRate,
      infectionRate,
      outcomes: [{ ward, avgLengthRate: avgLengthOfStay, mortalityRate, readmissionRate, date }]
    });
0
    // Save the new clinical outcome comparison document to the database
    await newClinicalOutcomeComparison.save();

    res.status(201).json({ message: 'Clinical outcome comparison data saved successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//9.clinical:
router.get('/clinicaloutcomecomparison', async (req, res) => {
  try {
    // Fetch all clinical outcome comparison data and select specific fields
    const clinicalOutcomeComparisonData = await ClinicalOutcomeComparison.find(
      {},
      '-_id ward timeInterval mortalityRate infectionRate'
    );

    res.json({ clinicalOutcomeComparison: clinicalOutcomeComparisonData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Define a GET endpoint to retrieve data from the "outcome" model
router.get('/outcomes', async (req, res) => {
  try {
    const outcomeData = await ClinicalOutcomeComparison.find({}, '-_id outcomes');

    res.json({ outcomeData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;





//dashboard 12:

router.get('/patientcensus', async (req, res) => {
  try {
    const data = await Bed.find({}, 'wards.beds.admissionTime wards.name');

    const patientCensus = {};

    data.forEach((entry) => {
      entry.wards.forEach((ward) => {
        ward.beds.forEach((bed) => {
          const { admissionTime } = bed;
          const wardName = ward.name;
          if (admissionTime && admissionTime !== "undefined") {
            if (!patientCensus[admissionTime]) {
              patientCensus[admissionTime] = { 'Ward A': 0, 'Ward B': 0 };
            }
            patientCensus[admissionTime][wardName]++;
          }
        });
      });
    });

    const result = {
      patientCensus: [],
    };

    for (const admissionTime in patientCensus) {
      result.patientCensus.push({
        ward: 'Ward A',
        time: admissionTime,
        patientCount: patientCensus[admissionTime]['Ward A'] || 0,
      });

      result.patientCensus.push({
        ward: 'Ward B',
        time: admissionTime,
        patientCount: patientCensus[admissionTime]['Ward B'] || 0,
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// //mortality rate:
// // Define your discharge route using the router

// router.post('/dischargemor', async (req, res) => {
//   try {
//     // Extract patient data from the request body
//     const {
//       patientId,
//       ward,
//       bedNumber,
//       name,
//       gender,
//       age,
//       admissionDate,
//       medicalAcuity,
//       dischargeReasons,
//       dischargeDate,
//       dischargeTime
//     } = req.body;

//     // Find the bed within the ward
//     const bed = await Bed.findOne({ 'wards.name': ward });

//     if (!bed) {
//       return res.status(404).json({ error: 'Ward not found.' });
//     }

//     // Find the specific bed within the ward
//     const wardIndex = bed.wards.findIndex(w => w.name === ward);
//     const bedIndex = bed.wards[wardIndex].beds.findIndex(b => b.number === bedNumber);

//     if (bedIndex === -1) {
//       return res.status(404).json({ error: 'Bed not found in the ward.' });
//     }

//     const selectedBed = bed.wards[wardIndex].beds[bedIndex];

//     if (selectedBed.status === 'occupied' && selectedBed.patientId === patientId) {
//       // Clear patient details in the bed record
//       selectedBed.status = 'available';
//       selectedBed.patientName = '';
//       selectedBed.gender = '';
//       selectedBed.age = '';
//       selectedBed.contactno = '';
//       selectedBed.patientId = '';
//       selectedBed.medicalAcuity = '';
//       selectedBed.address = '';
//       selectedBed.admissionDate = '';
//       selectedBed.admissionTime = '';
//       selectedBed.riskScore = '';

//       // Save the updated bed record
//       await bed.save();

//       // Check if the patient was discharged due to death
//       if (dischargeReasons.includes('Death')) {
//         // Create a discharged record with all the patient data, including the 'Death' reason
//         const discharged = new Discharged({
//           name,
//           age,
//           gender,
//           patientId,
//           admissionDate,
//           dischargeDate,
//           ward,
//           bedNumber,
//           medicalAcuity,
//           dischargeReasons,
//         });

//         // Save the discharged record to the database
//         await discharged.save();

//         // Calculate the mortality rate and send it as a response
//         const mortalityRate = await calculateMortalityRate();
//         res.json({ message: 'Patient discharged due to death, bed record deleted successfully.', mortalityRate });
//       } else {
//         // Handle non-death discharges here
//         // ...

//         // Calculate the mortality rate for all discharges (not just death) and send it as a response
//         const mortalityRate = await calculateMortalityRate();
//         res.json({ message: 'Patient discharged, bed record deleted successfully.', mortalityRate });
//       }
//     } else {
//       res.status(400).json({ error: 'Patient not found in the bed or not discharged.' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error discharging patient and calculating mortality rate.' });
//   }
// });

// // Function to calculate the mortality rate for patients who died on the same day as their discharge
// async function calculateMortalityRate() {
//   try {
//     const dischargedPatients = await Discharged.find({});

//     const totalDischarged = dischargedPatients.length;
//     const diedOnSameDay = dischargedPatients.filter((patient) => {
//       const dischargeDate = new Date(patient.dischargeDate);
//       const deathDate = new Date(patient.deathDate);
//       return (
//         patient.dischargeReasons.includes('Death') &&
//         dischargeDate.toDateString() === deathDate.toDateString()
//       );
//     }).length;

//     if (totalDischarged === 0) {
//       return "0.00"; // Handle the case where there are no discharged patients
//     }

//     const mortalityRate = (diedOnSameDay / totalDischarged) * 100;

//     console.log(`Mortality Rate for patients who died on the same day as discharge: ${mortalityRate.toFixed(2)}%`);

//     return mortalityRate.toFixed(2);
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// }

// module.exports = router;
