const { patientClient, rdvClient, pharmacieClient } = require('../grpc/clients');

const typeDefs = `
  type Patient {
    id: ID!
    nom: String!
    prenom: String!
    date_naissance: String
    cin: String
    groupe_sanguin: String
    allergies: String
  }

  type RendezVous {
    id: ID!
    patient_id: String!
    medecin: String!
    date_heure: String!
    motif: String
    statut: String!
  }

  type Ordonnance {
    id: ID!
    patient_id: String!
    rdv_id: String!
    medicaments: String!
    statut: String!
    date_emission: String!
  }

  type Query {
    patient(id: ID!): Patient
    patients: [Patient]
    rendezvous(id: ID!): RendezVous
    rendezvousByPatient(patient_id: ID!): [RendezVous]
    ordonnance(id: ID!): Ordonnance
    ordonnancesByPatient(patient_id: ID!): [Ordonnance]
  }
`;

const resolvers = {
  Query: {
    patient: (_, { id }) => new Promise((resolve, reject) => {
      patientClient.getPatient({ id }, (err, res) => err ? reject(err) : resolve(res));
    }),
    patients: () => new Promise((resolve, reject) => {
      patientClient.listPatients({}, (err, res) => err ? reject(err) : resolve(res.patients));
    }),
    rendezvous: (_, { id }) => new Promise((resolve, reject) => {
      rdvClient.getRendezVous({ id }, (err, res) => err ? reject(err) : resolve(res));
    }),
    rendezvousByPatient: (_, { patient_id }) => new Promise((resolve, reject) => {
      rdvClient.listRendezVous({ patient_id }, (err, res) => err ? reject(err) : resolve(res.rendezvous));
    }),
    ordonnance: (_, { id }) => new Promise((resolve, reject) => {
      pharmacieClient.getOrdonnance({ id }, (err, res) => err ? reject(err) : resolve(res));
    }),
    ordonnancesByPatient: (_, { patient_id }) => new Promise((resolve, reject) => {
      pharmacieClient.listOrdonnances({ patient_id }, (err, res) => err ? reject(err) : resolve(res.ordonnances));
    }),
  }
};

module.exports = { typeDefs, resolvers };