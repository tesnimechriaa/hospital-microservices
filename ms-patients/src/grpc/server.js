const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../db/database');

const PROTO_PATH = path.join(__dirname, '../../../proto/patient.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const patientProto = grpc.loadPackageDefinition(packageDef).patient;

const getPatient = async (call, callback) => {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM patients WHERE id = '${call.request.id}'`);
  if (!result.length || !result[0].values.length) {
    return callback({ code: grpc.status.NOT_FOUND, message: 'Patient non trouvé' });
  }
  const cols = result[0].columns;
  const row = result[0].values[0];
  const patient = {};
  cols.forEach((col, i) => patient[col] = row[i]);
  callback(null, patient);
};

const createPatient = async (call, callback) => {
  const db = await getDb();
  const id = uuidv4();
  const { nom, prenom, date_naissance, cin, groupe_sanguin, allergies } = call.request;
  db.run(
    `INSERT INTO patients (id, nom, prenom, date_naissance, cin, groupe_sanguin, allergies)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, nom, prenom, date_naissance, cin, groupe_sanguin, allergies]
  );
  saveDb();
  callback(null, { id, nom, prenom, date_naissance, cin, groupe_sanguin, allergies });
};

const listPatients = async (call, callback) => {
  const db = await getDb();
  const result = db.exec('SELECT * FROM patients');
  if (!result.length) return callback(null, { patients: [] });
  const cols = result[0].columns;
  const patients = result[0].values.map(row => {
    const p = {};
    cols.forEach((col, i) => p[col] = row[i]);
    return p;
  });
  callback(null, { patients });
};

const deletePatient = async (call, callback) => {
  const db = await getDb();
  db.run(`DELETE FROM patients WHERE id = '${call.request.id}'`);
  saveDb();
  callback(null, {});
};

async function main() {
  await getDb();
  const server = new grpc.Server();
  server.addService(patientProto.PatientService.service, {
    getPatient,
    createPatient,
    listPatients,
    deletePatient
  });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error(' Erreur:', err);
      return;
    }
    console.log(' MS Patients démarré sur le port 50051');
  });
}

main();