const { createRxDatabase, addRxPlugin } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');

const ordonnanceSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    patient_id: { type: 'string' },
    rdv_id: { type: 'string' },
    medicaments: { type: 'string' },
    statut: { type: 'string' },
    date_emission: { type: 'string' }
  },
  required: ['id', 'patient_id', 'rdv_id', 'medicaments']
};

let db;

async function getDb() {
  if (db) return db;
  
  const database = await createRxDatabase({
    name: 'pharmaciedb',
    storage: getRxStorageMemory()
  });

  await database.addCollections({
    ordonnances: { schema: ordonnanceSchema }
  });

  db = database;
  return db;
}

module.exports = { getDb };