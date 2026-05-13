const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { startConsumer } = require('../kafka/consumer');

const PROTO_PATH = path.join(__dirname, '../../../proto/pharmacie.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const pharmacieProto = grpc.loadPackageDefinition(packageDef).pharmacie;

const createOrdonnance = async (call, callback) => {
  const db = await getDb();
  const id = uuidv4();
  const { patient_id, rdv_id, medicaments } = call.request;
  const date_emission = new Date().toISOString();
  const ordo = { id, patient_id, rdv_id, medicaments, statut: 'en_attente', date_emission };
  await db.ordonnances.insert(ordo);
  callback(null, ordo);
};

const getOrdonnance = async (call, callback) => {
  const db = await getDb();
  const ordo = await db.ordonnances.findOne(call.request.id).exec();
  if (!ordo) return callback({ code: grpc.status.NOT_FOUND, message: 'Ordonnance non trouvée' });
  callback(null, ordo.toJSON());
};

const delivrerOrdonnance = async (call, callback) => {
  const db = await getDb();
  const ordo = await db.ordonnances.findOne(call.request.id).exec();
  if (!ordo) return callback({ code: grpc.status.NOT_FOUND, message: 'Ordonnance non trouvée' });
  await ordo.patch({ statut: 'delivree' });
  callback(null, ordo.toJSON());
};

const listOrdonnances = async (call, callback) => {
  const db = await getDb();
  const result = await db.ordonnances.find({
    selector: { patient_id: call.request.patient_id }
  }).exec();
  callback(null, { ordonnances: result.map(o => o.toJSON()) });
};

async function main() {
  await getDb();
  await startConsumer();
  const server = new grpc.Server();
  server.addService(pharmacieProto.PharmacieService.service, {
    createOrdonnance,
    getOrdonnance,
    delivrerOrdonnance,
    listOrdonnances
  });
  server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), () => {
    console.log(' MS Pharmacie démarré sur le port 50053');
  });
}

main();