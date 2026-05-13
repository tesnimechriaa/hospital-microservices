const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const loadProto = (filename) => {
  const PROTO_PATH = path.join(__dirname, '../../../proto/', filename);
  const packageDef = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
  });
  return grpc.loadPackageDefinition(packageDef);
};

const patientProto = loadProto('patient.proto').patient;
const rdvProto = loadProto('rendezvous.proto').rendezvous;
const pharmacieProto = loadProto('pharmacie.proto').pharmacie;

const patientClient = new patientProto.PatientService('localhost:50051', grpc.credentials.createInsecure());
const rdvClient = new rdvProto.RendezVousService('localhost:50052', grpc.credentials.createInsecure());
const pharmacieClient = new pharmacieProto.PharmacieService('localhost:50053', grpc.credentials.createInsecure());

module.exports = { patientClient, rdvClient, pharmacieClient };