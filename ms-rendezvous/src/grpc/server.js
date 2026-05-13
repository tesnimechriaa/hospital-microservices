const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../db/database');
const { sendEvent } = require('../kafka/producer');

const PROTO_PATH = path.join(__dirname, '../../../proto/rendezvous.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const rdvProto = grpc.loadPackageDefinition(packageDef).rendezvous;

const createRendezVous = async (call, callback) => {
  const db = await getDb();
  const id = uuidv4();
  const { patient_id, medecin, date_heure, motif } = call.request;
  db.run(
    `INSERT INTO rendezvous (id, patient_id, medecin, date_heure, motif, statut) VALUES (?, ?, ?, ?, ?, 'planifie')`,
    [id, patient_id, medecin, date_heure, motif]
  );
  saveDb();
  callback(null, { id, patient_id, medecin, date_heure, motif, statut: 'planifie' });
};

const getRendezVous = async (call, callback) => {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM rendezvous WHERE id = '${call.request.id}'`);
  if (!result.length || !result[0].values.length) {
    return callback({ code: grpc.status.NOT_FOUND, message: 'RDV non trouvé' });
  }
  const cols = result[0].columns;
  const row = result[0].values[0];
  const rdv = {};
  cols.forEach((col, i) => rdv[col] = row[i]);
  callback(null, rdv);
};

const listRendezVous = async (call, callback) => {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM rendezvous WHERE patient_id = '${call.request.patient_id}'`);
  if (!result.length) return callback(null, { rendezvous: [] });
  const cols = result[0].columns;
  const rendezvous = result[0].values.map(row => {
    const r = {};
    cols.forEach((col, i) => r[col] = row[i]);
    return r;
  });
  callback(null, { rendezvous });
};

const updateStatut = async (call, callback) => {
  const db = await getDb();
  db.run(`UPDATE rendezvous SET statut = '${call.request.statut}' WHERE id = '${call.request.id}'`);
  saveDb();
  const result = db.exec(`SELECT * FROM rendezvous WHERE id = '${call.request.id}'`);
  if (!result.length || !result[0].values.length) {
    return callback({ code: grpc.status.NOT_FOUND, message: 'RDV non trouvé' });
  }
  const cols = result[0].columns;
  const row = result[0].values[0];
  const rdv = {};
  cols.forEach((col, i) => rdv[col] = row[i]);
  if (call.request.statut === 'confirme') {
    await sendEvent('rdv.confirme', {
      id: rdv.id,
      patient_id: rdv.patient_id,
      medecin: rdv.medecin,
      date_heure: rdv.date_heure
    });
  }
  callback(null, rdv);
};

const deleteRendezVous = async (call, callback) => {
  const db = await getDb();
  db.run(`DELETE FROM rendezvous WHERE id = '${call.request.id}'`);
  saveDb();
  callback(null, {});
};

async function main() {
  await getDb();
  const server = new grpc.Server();
  server.addService(rdvProto.RendezVousService.service, {
    createRendezVous,
    getRendezVous,
    listRendezVous,
    updateStatut,
    deleteRendezVous
  });
  server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), () => {
    console.log(' MS Rendez-vous démarré sur le port 50052');
  });
}

main();